"""Google Places API (New) client with 3-tier caching.

Caching mirrors the pattern the repo used for TMDB:
  1. In-memory dict (single Lambda invocation)
  2. DynamoDB CACHE# items with TTL auto-delete
  3. Google API

Cost control:
  - Every request declares a lean field mask (fields determine the billing SKU)
  - Nearby searches are bucketed by geohash cell + cuisine + radius, so a room
    swiping in the same neighborhood hits Google once per cuisine per TTL window
  - Photo URIs and geocodes are cached individually

ToS note: place data caches are capped at 30 days; place_id may be stored
indefinitely (match records rely on this).
"""

import json
import math
import os
import time
from typing import Any, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from shared.dynamo import get_item, put_item

PLACES_BASE_URL = "https://places.googleapis.com/v1"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

# Cache TTLs in seconds (all well under the 30-day ToS cap)
CACHE_TTL_NEARBY = 24 * 3600        # 1 day
CACHE_TTL_DETAILS = 7 * 24 * 3600   # 7 days
CACHE_TTL_PHOTO = 7 * 24 * 3600     # 7 days
CACHE_TTL_GEOCODE = 30 * 24 * 3600  # 30 days (coordinates for an address)

PHOTO_MAX_WIDTH_PX = 640

# Lean field mask for deck building. Requested fields determine the billed SKU
# tier — verify the exact field->SKU mapping against current Google docs
# before adding fields here.
NEARBY_FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.types",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.photos",
    "places.shortFormattedAddress",
    "places.currentOpeningHours.openNow",
])

DETAILS_FIELD_MASK = ",".join([
    "id",
    "displayName",
    "types",
    "location",
    "rating",
    "userRatingCount",
    "priceLevel",
    "photos",
    "shortFormattedAddress",
    "googleMapsUri",
])

# Cuisine ids (must match frontend CUISINES) -> Places API (New) place types.
# NOTE: verify type names against Table A in the current Places docs when the
# API key is available; unrecognized types make searchNearby return 400.
CUISINE_PLACE_TYPES: dict[str, list[str]] = {
    "italian": ["italian_restaurant"],
    "mexican": ["mexican_restaurant"],
    "chinese": ["chinese_restaurant"],
    "sushi": ["sushi_restaurant", "japanese_restaurant"],
    "thai": ["thai_restaurant"],
    "indian": ["indian_restaurant"],
    "pizza": ["pizza_restaurant"],
    "burgers": ["hamburger_restaurant", "american_restaurant"],
    "bbq": ["barbecue_restaurant"],
    "mediterranean": ["mediterranean_restaurant", "greek_restaurant", "middle_eastern_restaurant"],
    "korean": ["korean_restaurant"],
    "vietnamese": ["vietnamese_restaurant"],
    "seafood": ["seafood_restaurant"],
    "breakfast": ["breakfast_restaurant", "brunch_restaurant"],
    "steakhouse": ["steak_house"],
    "ramen": ["ramen_restaurant"],
    "vegetarian": ["vegetarian_restaurant", "vegan_restaurant"],
    "cafe": ["cafe", "bakery", "coffee_shop"],
    "wings": ["bar_and_grill", "pub"],
    "dessert": ["dessert_shop", "ice_cream_shop"],
}

# Reverse map: place type -> display tag shown on cards
TYPE_DISPLAY_NAMES = {
    "italian_restaurant": "Italian",
    "mexican_restaurant": "Mexican",
    "chinese_restaurant": "Chinese",
    "sushi_restaurant": "Sushi",
    "japanese_restaurant": "Japanese",
    "thai_restaurant": "Thai",
    "indian_restaurant": "Indian",
    "pizza_restaurant": "Pizza",
    "hamburger_restaurant": "Burgers",
    "american_restaurant": "American",
    "barbecue_restaurant": "BBQ",
    "mediterranean_restaurant": "Mediterranean",
    "greek_restaurant": "Greek",
    "middle_eastern_restaurant": "Middle Eastern",
    "korean_restaurant": "Korean",
    "vietnamese_restaurant": "Vietnamese",
    "seafood_restaurant": "Seafood",
    "breakfast_restaurant": "Breakfast",
    "brunch_restaurant": "Brunch",
    "steak_house": "Steakhouse",
    "ramen_restaurant": "Ramen",
    "vegetarian_restaurant": "Vegetarian",
    "vegan_restaurant": "Vegan",
    "cafe": "Café",
    "bakery": "Bakery",
    "coffee_shop": "Coffee",
    "bar_and_grill": "Bar & Grill",
    "pub": "Pub",
    "dessert_shop": "Dessert",
    "ice_cream_shop": "Ice Cream",
    "restaurant": "Restaurant",
}

PRICE_LEVEL_VALUES = {
    "PRICE_LEVEL_FREE": 0,
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}

# In-memory cache for the duration of a single Lambda invocation
_mem_cache: dict[str, Any] = {}


def _get_api_key() -> str:
    return os.environ.get("GOOGLE_API_KEY", "")


# --- Geometry helpers -------------------------------------------------------

_GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"


def geohash_encode(lat: float, lng: float, precision: int = 5) -> str:
    """Standard geohash. Precision 5 ~= 4.9km x 4.9km cell — coarse enough
    that small GPS jitter maps to the same cache bucket."""
    lat_range = [-90.0, 90.0]
    lng_range = [-180.0, 180.0]
    result = []
    bit = 0
    ch = 0
    even = True
    while len(result) < precision:
        if even:
            mid = (lng_range[0] + lng_range[1]) / 2
            if lng >= mid:
                ch |= 1 << (4 - bit)
                lng_range[0] = mid
            else:
                lng_range[1] = mid
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if lat >= mid:
                ch |= 1 << (4 - bit)
                lat_range[0] = mid
            else:
                lat_range[1] = mid
        even = not even
        if bit < 4:
            bit += 1
        else:
            result.append(_GEOHASH_BASE32[ch])
            bit = 0
            ch = 0
    return "".join(result)


def haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in miles."""
    r = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


# --- HTTP + cache plumbing --------------------------------------------------

def _http_json(url: str, method: str = "GET", body: Optional[dict] = None,
               headers: Optional[dict] = None) -> Optional[dict]:
    """Single choke point for all Google HTTP calls (stubbed in tests)."""
    data = json.dumps(body).encode() if body is not None else None
    req = Request(url, data=data, method=method,
                  headers={"Accept": "application/json", **(headers or {})})
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as e:
        print(f"Google API request failed: {e}")
        return None


def _cached(cache_key: str, ttl: int, fetch):
    """3-tier cache wrapper: memory -> DynamoDB -> fetch()."""
    if cache_key in _mem_cache:
        return _mem_cache[cache_key]

    item = get_item(f"CACHE#{cache_key}", "DATA")
    if item and item.get("data"):
        try:
            data = json.loads(item["data"])
            _mem_cache[cache_key] = data
            return data
        except (json.JSONDecodeError, TypeError):
            pass

    data = fetch()
    if data is not None:
        _mem_cache[cache_key] = data
        put_item({
            "PK": f"CACHE#{cache_key}",
            "SK": "DATA",
            "data": json.dumps(data),
            "ttl": int(time.time()) + ttl,
        })
    return data


# --- Public API -------------------------------------------------------------

def nearby_search(lat: float, lng: float, radius_m: int, cuisine_id: str) -> list[dict]:
    """Cached nearby restaurant search for one cuisine group.

    Cache key buckets location to a geohash5 cell so nearby requests reuse
    results; radius participates in the key so widening re-fetches.
    """
    types = CUISINE_PLACE_TYPES.get(cuisine_id)
    if not types:
        return []

    cell = geohash_encode(lat, lng, 5)
    cache_key = f"nearby#{cell}#{cuisine_id}#{radius_m}"

    def fetch():
        api_key = _get_api_key()
        if not api_key:
            return None
        resp = _http_json(
            f"{PLACES_BASE_URL}/places:searchNearby",
            method="POST",
            body={
                "includedTypes": types,
                "maxResultCount": 20,
                "locationRestriction": {
                    "circle": {
                        "center": {"latitude": lat, "longitude": lng},
                        "radius": float(radius_m),
                    }
                },
            },
            headers={
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": NEARBY_FIELD_MASK,
            },
        )
        if resp is None:
            return None
        return resp.get("places", [])

    return _cached(cache_key, CACHE_TTL_NEARBY, fetch) or []


def get_place_details(place_id: str) -> Optional[dict]:
    """Cached place details (used for match snapshot refresh)."""
    cache_key = f"place#{place_id}"

    def fetch():
        api_key = _get_api_key()
        if not api_key:
            return None
        return _http_json(
            f"{PLACES_BASE_URL}/places/{quote(place_id, safe='')}",
            headers={
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": DETAILS_FIELD_MASK,
            },
        )

    return _cached(cache_key, CACHE_TTL_DETAILS, fetch)


def resolve_photo_url(photo_name: str) -> Optional[str]:
    """Resolve a places photo resource name to a servable URI (cached).

    Uses skipHttpRedirect so Google returns JSON instead of a 302.
    """
    if not photo_name:
        return None
    cache_key = f"photo#{photo_name}"

    def fetch():
        api_key = _get_api_key()
        if not api_key:
            return None
        resp = _http_json(
            f"{PLACES_BASE_URL}/{photo_name}/media"
            f"?maxWidthPx={PHOTO_MAX_WIDTH_PX}&skipHttpRedirect=true&key={api_key}"
        )
        if resp is None:
            return None
        return {"uri": resp.get("photoUri")}

    data = _cached(cache_key, CACHE_TTL_PHOTO, fetch)
    return data.get("uri") if data else None


def geocode(address: str) -> Optional[dict]:
    """Geocode an address string -> {lat, lng, label} (cached)."""
    normalized = " ".join(address.lower().split())
    cache_key = f"geocode#{quote(normalized, safe='')[:200]}"

    def fetch():
        api_key = _get_api_key()
        if not api_key:
            return None
        resp = _http_json(f"{GEOCODE_URL}?{urlencode({'address': address, 'key': api_key})}")
        if not resp or resp.get("status") != "OK" or not resp.get("results"):
            return None
        top = resp["results"][0]
        loc = top["geometry"]["location"]
        return {
            "lat": loc["lat"],
            "lng": loc["lng"],
            "label": top.get("formatted_address", address),
        }

    return _cached(cache_key, CACHE_TTL_GEOCODE, fetch)


def parse_stored_location(stored) -> Optional[dict]:
    """Convert a room's stored location (string/Decimal coords) to floats."""
    if not stored:
        return None
    try:
        return {
            "lat": float(stored["lat"]),
            "lng": float(stored["lng"]),
            "label": stored.get("label", ""),
        }
    except (KeyError, TypeError, ValueError):
        return None


def extract_card(place: dict, origin_lat: float, origin_lng: float) -> Optional[dict]:
    """Convert a Places API (New) place into the frontend RestaurantCard shape.

    Photo resolution is deferred — the caller decides which cards are worth
    a photo call (cost control).
    """
    place_id = place.get("id")
    name = (place.get("displayName") or {}).get("text")
    if not place_id or not name:
        return None

    location = place.get("location") or {}
    lat = location.get("latitude")
    lng = location.get("longitude")
    distance = (
        round(haversine_miles(origin_lat, origin_lng, lat, lng), 1)
        if lat is not None and lng is not None
        else None
    )

    cuisines = []
    for t in place.get("types", []):
        label = TYPE_DISPLAY_NAMES.get(t)
        if label and label not in cuisines and label != "Restaurant":
            cuisines.append(label)
    if not cuisines:
        cuisines = ["Restaurant"]

    open_now = ((place.get("currentOpeningHours") or {}).get("openNow"))

    card = {
        "place_id": place_id,
        "name": name,
        "photo_url": None,  # filled in by the caller via resolve_photo_url
        "cuisines": cuisines[:3],
        "rating": float(place.get("rating") or 0),
        "rating_count": int(place.get("userRatingCount") or 0),
        "price_level": PRICE_LEVEL_VALUES.get(place.get("priceLevel")),
        "address": place.get("shortFormattedAddress", ""),
        "lat": lat,
        "lng": lng,
        "distance_mi": distance,
        "maps_url": place.get("googleMapsUri"),
        "_photo_name": ((place.get("photos") or [{}])[0]).get("name"),
    }
    if open_now is not None:
        card["open_now"] = bool(open_now)
    return card
