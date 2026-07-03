"""POST /rooms — Create a new room and return room code + first member ID."""

import random
import string
import uuid
from datetime import datetime, timezone

from shared.dynamo import put_item, get_item
from shared.response import created, server_error
from shared.validation import parse_body


def _generate_room_code() -> str:
    """Generate a room code in the format EATS-XXXX (4 uppercase alphanumeric)."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=4))
    return f"EATS-{suffix}"


def _generate_unique_room_code(max_attempts: int = 10) -> str:
    """Generate a room code that doesn't already exist in DynamoDB."""
    for _ in range(max_attempts):
        code = _generate_room_code()
        existing = get_item(f"ROOM#{code}", "METADATA")
        if existing is None:
            return code
    # Extremely unlikely to exhaust attempts with 36^4 = 1.6M combinations
    raise RuntimeError("Failed to generate unique room code")


def handler(event, context):
    try:
        body = parse_body(event) or {}
        is_solo = bool(body.get("solo", False))

        code = _generate_unique_room_code()
        member_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        # Group-ready: members map + count. Couples MVP caps at 2 (1 for solo);
        # raising max_members is the only change needed for bigger groups.
        item = {
            "PK": f"ROOM#{code}",
            "SK": "METADATA",
            "room_code": code,
            "members": {member_id: {"joined_at": now, "number": 1}},
            "member_count": 1,
            "max_members": 1 if is_solo else 2,
            "created_at": now,
            "onboarding_complete": False,
            "is_solo": is_solo,
            "location": None,
            "radius_m": 8047,  # 5 mi default
            "price_levels": [],
        }

        put_item(item)

        return created({
            "room_code": code,
            "partner_id": member_id,
        })

    except Exception as e:
        print(f"Error creating room: {e}")
        return server_error("Failed to create room")
