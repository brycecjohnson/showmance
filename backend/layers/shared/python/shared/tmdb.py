"""TMDB API client with DynamoDB caching."""

import os
import time
import hashlib
import json
from typing import Any, Optional
from urllib.request import urlopen, Request
from urllib.error import HTTPError

from shared.dynamo import get_item, put_item


TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

# Cache TTLs in seconds
CACHE_TTL_TRENDING = 6 * 3600       # 6 hours
CACHE_TTL_DISCOVER = 24 * 3600      # 1 day
CACHE_TTL_DETAILS = 7 * 24 * 3600   # 7 days

# In-memory cache for the duration of a single Lambda invocation
_mem_cache: dict[str, Any] = {}


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
    except (HTTPError, Exception):
        return None


def fetch_cached(path: str, params: dict = None, ttl: int = CACHE_TTL_DISCOVER) -> Optional[dict]:
    """Fetch from TMDB with DynamoDB caching."""
    params = params or {}
    key = _cache_key(path, params)

    # Check in-memory cache first
    if key in _mem_cache:
        return _mem_cache[key]

    # Check DynamoDB cache
    cached = get_item(f"CACHE#{key}", "DATA")
    if cached and cached.get("ttl", 0) > int(time.time()):
        data = json.loads(cached["data"])
        _mem_cache[key] = data
        return data

    # Fetch from TMDB
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


def get_details(media_type: str, tmdb_id: int) -> Optional[dict]:
    """Get full details for a movie or TV show."""
    return fetch_cached(
        f"/{media_type}/{tmdb_id}",
        {"append_to_response": "watch/providers,credits"},
        ttl=CACHE_TTL_DETAILS,
    )


def poster_url(path: str, size: str = "w500") -> str:
    """Build a full poster image URL."""
    if not path:
        return ""
    return f"{TMDB_IMAGE_BASE}/{size}{path}"
