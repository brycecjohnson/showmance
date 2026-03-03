"""Input validation helpers."""

import json
import re
import uuid
from typing import Any, Optional


ROOM_CODE_PATTERN = re.compile(r"^SHOW-[A-Z0-9]{4}$")

VALID_MEDIA_TYPES = {"movie", "tv"}

VALID_ERAS = {"classics", "2000s", "2010s", "new_releases", "all"}

VALID_GENRES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
    80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
    14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
    10759: "Action & Adventure", 10762: "Kids", 10763: "News",
    10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap",
    10767: "Talk", 10768: "War & Politics",
}


def parse_body(event: dict) -> Optional[dict]:
    """Parse JSON body from API Gateway event. Returns None on failure."""
    body = event.get("body")
    if not body:
        return None
    try:
        if isinstance(body, str):
            return json.loads(body)
        return body
    except (json.JSONDecodeError, TypeError):
        return None


def get_path_param(event: dict, name: str) -> Optional[str]:
    """Get a path parameter from the event."""
    params = event.get("pathParameters") or {}
    return params.get(name)


def get_query_param(event: dict, name: str, default: str = None) -> Optional[str]:
    """Get a query string parameter from the event."""
    params = event.get("queryStringParameters") or {}
    return params.get(name, default)


def get_partner_id(event: dict) -> Optional[str]:
    """Extract partner ID from X-Partner-Id header."""
    headers = event.get("headers") or {}
    # API Gateway lowercases headers
    return headers.get("x-partner-id") or headers.get("X-Partner-Id")


def is_valid_room_code(code: str) -> bool:
    """Check if a room code matches the SHOW-XXXX pattern."""
    return bool(code and ROOM_CODE_PATTERN.match(code))


def is_valid_uuid(value: str) -> bool:
    """Check if a string is a valid UUID."""
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


def is_valid_media_type(value: str) -> bool:
    """Check if a media type is valid."""
    return value in VALID_MEDIA_TYPES
