"""Helpers for shaping MATCH items into API responses."""

from typing import Optional

from shared.places import haversine_miles


def _to_float(value) -> Optional[float]:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def match_to_response(item: dict, origin: Optional[dict]) -> dict:
    """Convert a stored MATCH item to the frontend Match shape.

    Distance is derived from the room's *current* location so it stays
    correct when the room moves.
    """
    lat = _to_float(item.get("lat"))
    lng = _to_float(item.get("lng"))
    distance_mi = None
    if origin and lat is not None and lng is not None:
        distance_mi = round(
            haversine_miles(origin["lat"], origin["lng"], lat, lng), 1
        )

    price_level = item.get("price_level")

    return {
        "place_id": item["place_id"],
        "name": item.get("name", ""),
        "photo_url": item.get("photo_url"),
        "matched_at": item.get("matched_at", ""),
        "visited": bool(item.get("visited", False)),
        "visited_at": item.get("visited_at"),
        "rating": _to_float(item.get("rating")) or 0,
        "price_level": int(price_level) if price_level is not None else None,
        "cuisines": list(item.get("cuisines", [])),
        "address": item.get("address", ""),
        "distance_mi": distance_mi,
        "maps_url": item.get("maps_url"),
    }
