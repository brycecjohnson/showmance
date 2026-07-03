"""Input validation helpers."""

import json
import re
import uuid
from typing import Optional


ROOM_CODE_PATTERN = re.compile(r"^EATS-[A-Z0-9]{4}$")

# Google place_id: opaque token, typically ~27 chars starting with ChIJ but
# not guaranteed — validate charset and length only.
PLACE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{4,256}$")

# Must match frontend CUISINES ids (frontend/src/utils/constants.ts)
VALID_CUISINES = {
    "italian", "mexican", "chinese", "sushi", "thai", "indian", "pizza",
    "burgers", "bbq", "mediterranean", "korean", "vietnamese", "seafood",
    "breakfast", "steakhouse", "ramen", "vegetarian", "cafe", "wings",
    "dessert",
}

VALID_PRICE_LEVELS = {1, 2, 3, 4}

MIN_RADIUS_M = 500
MAX_RADIUS_M = 50000


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
    """Extract member ID from X-Partner-Id header."""
    headers = event.get("headers") or {}
    # API Gateway lowercases headers
    return headers.get("x-partner-id") or headers.get("X-Partner-Id")


def is_valid_room_code(code: str) -> bool:
    """Check if a room code matches the EATS-XXXX pattern."""
    return bool(code and ROOM_CODE_PATTERN.match(code))


def is_valid_uuid(value: str) -> bool:
    """Check if a string is a valid UUID."""
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


def is_valid_place_id(value: str) -> bool:
    """Check if a string looks like a Google place_id."""
    return bool(value and isinstance(value, str) and PLACE_ID_PATTERN.match(value))


def is_valid_lat_lng(lat, lng) -> bool:
    """Check latitude/longitude bounds."""
    try:
        return -90 <= float(lat) <= 90 and -180 <= float(lng) <= 180
    except (TypeError, ValueError):
        return False


def is_valid_radius(radius_m) -> bool:
    """Check search radius bounds (meters)."""
    try:
        return MIN_RADIUS_M <= int(radius_m) <= MAX_RADIUS_M
    except (TypeError, ValueError):
        return False


def is_member(room: dict, member_id: str) -> bool:
    """Check whether a member id belongs to the room."""
    return bool(member_id) and member_id in (room.get("members") or {})
