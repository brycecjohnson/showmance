"""TMDB API client with 3-tier caching (in-memory + DynamoDB + TTL auto-delete)."""

import os
import time
import hashlib
import json
from typing import Any, Optional
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

from shared.dynamo import get_item, put_item


TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

# Cache TTLs in seconds
CACHE_TTL_TRENDING = 6 * 3600       # 6 hours
CACHE_TTL_DISCOVER = 24 * 3600      # 1 day
CACHE_TTL_DETAILS = 7 * 24 * 3600   # 7 days
CACHE_TTL_RECOMMENDATIONS = 3 * 24 * 3600  # 3 days
CACHE_TTL_PROVIDERS = 7 * 24 * 3600  # 7 days (providers change rarely)

# In-memory cache for the duration of a single Lambda invocation
_mem_cache: dict[str, Any] = {}

# TMDB watch provider IDs for supported streaming services
PROVIDER_IDS = {
    "netflix": 8,
    "amazon_prime": 9,
    "disney_plus": 337,
    "hulu": 15,
    "hbo_max": 384,
    "apple_tv_plus": 350,
    "peacock": 386,
    "paramount_plus": 531,
}

# Era filter year ranges
ERA_YEAR_RANGES = {
    "classics": (None, 1999),
    "2000s": (2000, 2009),
    "2010s": (2010, 2019),
    "new_releases": (2024, None),
    "all": (None, None),
}


def _get_api_key() -> str:
    return os.environ.get("TMDB_API_KEY", "")


def _cache_key(path: str, params: dict) -> str:
    """Generate a deterministic cache key from API path and params."""
    sorted_params = sorted(params.items())
    raw = f"{path}?{'&'.join(f'{k}={v}' for k, v in sorted_params)}"
    return hashlib.md5(raw.encode()).hexdigest()


def _fetch_from_tmdb(path: str, params: dict = None) -> Optional[dict]:
    """Make an HTTP request to TMDB API."""
    params = params or {}
    api_key = _get_api_key()
    if not api_key:
        return None

    query_parts = [f"api_key={api_key}"]
    for k, v in params.items():
        query_parts.append(f"{k}={v}")
    query_string = "&".join(query_parts)
    url = f"{TMDB_BASE_URL}{path}?{query_string}"

    req = Request(url, headers={"Accept": "application/json"})
    try:
        with urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode())
    except (HTTPError, URLError, Exception):
        return None


def fetch_cached(path: str, params: dict = None, ttl: int = CACHE_TTL_DISCOVER) -> Optional[dict]:
    """Fetch from TMDB with 3-tier caching: in-memory -> DynamoDB -> TMDB API."""
    params = params or {}
    key = _cache_key(path, params)

    # Tier 1: in-memory cache (same Lambda invocation)
    if key in _mem_cache:
        return _mem_cache[key]

    # Tier 2: DynamoDB cache (cross-invocation, auto-deleted by TTL)
    cached = get_item(f"CACHE#{key}", "DATA")
    if cached and cached.get("ttl", 0) > int(time.time()):
        data = json.loads(cached["data"])
        _mem_cache[key] = data
        return data

    # Tier 3: fetch from TMDB API
    data = _fetch_from_tmdb(path, params)
    if data is None:
        return None

    # Store in DynamoDB cache
    put_item({
        "PK": f"CACHE#{key}",
        "SK": "DATA",
        "data": json.dumps(data),
        "ttl": int(time.time()) + ttl,
    })

    # Store in memory cache
    _mem_cache[key] = data
    return data


# ---------------------------------------------------------------------------
# Core TMDB endpoints
# ---------------------------------------------------------------------------

def get_trending(media_type: str, time_window: str = "week", page: int = 1) -> Optional[dict]:
    """Get trending movies or TV shows."""
    return fetch_cached(
        f"/trending/{media_type}/{time_window}",
        {"page": str(page)},
        ttl=CACHE_TTL_TRENDING,
    )


def get_discover(media_type: str, params: dict = None, page: int = 1) -> Optional[dict]:
    """Discover movies or TV shows with filters."""
    params = params or {}
    params["page"] = str(page)
    return fetch_cached(f"/discover/{media_type}", params, ttl=CACHE_TTL_DISCOVER)


def get_recommendations(media_type: str, tmdb_id: int, page: int = 1) -> Optional[dict]:
    """Get recommendations based on a specific title."""
    return fetch_cached(
        f"/{media_type}/{tmdb_id}/recommendations",
        {"page": str(page)},
        ttl=CACHE_TTL_RECOMMENDATIONS,
    )


def get_similar(media_type: str, tmdb_id: int, page: int = 1) -> Optional[dict]:
    """Get similar titles based on a specific title."""
    return fetch_cached(
        f"/{media_type}/{tmdb_id}/similar",
        {"page": str(page)},
        ttl=CACHE_TTL_RECOMMENDATIONS,
    )


def get_details(media_type: str, tmdb_id: int) -> Optional[dict]:
    """Get full details for a movie or TV show."""
    return fetch_cached(
        f"/{media_type}/{tmdb_id}",
        {"append_to_response": "watch/providers,credits"},
        ttl=CACHE_TTL_DETAILS,
    )


def get_watch_providers(media_type: str, tmdb_id: int) -> Optional[dict]:
    """Get watch/streaming providers for a title."""
    return fetch_cached(
        f"/{media_type}/{tmdb_id}/watch/providers",
        {},
        ttl=CACHE_TTL_PROVIDERS,
    )


def poster_url(path: str, size: str = "w500") -> str:
    """Build a full poster image URL."""
    if not path:
        return ""
    return f"{TMDB_IMAGE_BASE}/{size}{path}"


# ---------------------------------------------------------------------------
# Higher-level content helpers for the card pipeline
# ---------------------------------------------------------------------------

def build_discover_params(
    genre_ids: list[int] = None,
    eras: list[str] = None,
    streaming_services: list[str] = None,
    min_vote_count: int = 50,
    sort_by: str = "popularity.desc",
) -> dict:
    """Build TMDB discover params from room preferences."""
    params = {
        "sort_by": sort_by,
        "vote_count.gte": str(min_vote_count),
        "include_adult": "false",
    }

    if genre_ids:
        # Use OR join (pipe) so any liked genre matches
        params["with_genres"] = "|".join(str(g) for g in genre_ids)

    if eras:
        min_year, max_year = _eras_to_year_range(eras)
        if min_year is not None:
            params["primary_release_date.gte"] = f"{min_year}-01-01"
            params["first_air_date.gte"] = f"{min_year}-01-01"
        if max_year is not None:
            params["primary_release_date.lte"] = f"{max_year}-12-31"
            params["first_air_date.lte"] = f"{max_year}-12-31"

    if streaming_services:
        provider_ids = [
            str(PROVIDER_IDS[s]) for s in streaming_services if s in PROVIDER_IDS
        ]
        if provider_ids:
            params["with_watch_providers"] = "|".join(provider_ids)
            params["watch_region"] = "US"

    return params


def _eras_to_year_range(eras: list[str]) -> tuple[Optional[int], Optional[int]]:
    """Convert era preferences to a min/max year range."""
    if not eras or "all" in eras:
        return (None, None)

    min_year = None
    max_year = None
    for era in eras:
        era_range = ERA_YEAR_RANGES.get(era)
        if not era_range:
            continue
        era_min, era_max = era_range
        if era_min is not None:
            min_year = min(min_year, era_min) if min_year is not None else era_min
        else:
            min_year = None  # open-ended low bound
        if era_max is not None:
            max_year = max(max_year, era_max) if max_year is not None else era_max
        else:
            max_year = None  # open-ended high bound

    return (min_year, max_year)


def extract_card_data(item: dict, media_type: str) -> dict:
    """Extract the fields needed for a swipe card from a TMDB result item."""
    if media_type == "movie":
        title = item.get("title", "")
        release_date = item.get("release_date", "")
        year = release_date[:4] if release_date else ""
    else:
        title = item.get("name", "")
        first_air = item.get("first_air_date", "")
        year = first_air[:4] if first_air else ""

    return {
        "tmdb_id": item.get("id"),
        "media_type": media_type,
        "title": title,
        "year": year,
        "overview": item.get("overview", ""),
        "poster_path": poster_url(item.get("poster_path", "")),
        "backdrop_path": poster_url(item.get("backdrop_path", ""), size="w780"),
        "vote_average": float(item.get("vote_average", 0)),
        "genre_ids": item.get("genre_ids", []),
        "popularity": float(item.get("popularity", 0)),
    }


def get_seed_titles(media_type: str, genre_ids: list[int], count: int = 15) -> list[dict]:
    """Get well-known seed titles for onboarding based on genre overlap.

    Returns popular, high-recognition titles that partners swipe on to
    calibrate the recommendation engine.
    """
    seen_ids: set[int] = set()
    titles: list[dict] = []

    # Source 1: Trending (high recognition)
    trending = get_trending(media_type)
    if trending:
        for item in trending.get("results", []):
            tid = item.get("id")
            if tid and tid not in seen_ids and item.get("poster_path"):
                seen_ids.add(tid)
                titles.append(extract_card_data(item, media_type))

    # Source 2: Discover by each liked genre, sorted by popularity
    for genre_id in genre_ids[:5]:  # Limit to top 5 genres
        if len(titles) >= count * 2:
            break
        data = get_discover(
            media_type,
            params={
                "with_genres": str(genre_id),
                "sort_by": "popularity.desc",
                "vote_count.gte": "200",
                "include_adult": "false",
            },
        )
        if data:
            for item in data.get("results", [])[:5]:
                tid = item.get("id")
                if tid and tid not in seen_ids and item.get("poster_path"):
                    seen_ids.add(tid)
                    titles.append(extract_card_data(item, media_type))

    # Sort by popularity (highest first) and return top N
    titles.sort(key=lambda t: t["popularity"], reverse=True)
    return titles[:count]
