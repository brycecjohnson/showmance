"""POST /rooms — Create a new room and return room code + partner_1 ID."""

import random
import string
import uuid
from datetime import datetime, timezone

from shared.dynamo import put_item, get_item
from shared.response import created, error, server_error


def _generate_room_code() -> str:
    """Generate a room code in the format SHOW-XXXX (4 uppercase alphanumeric)."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=4))
    return f"SHOW-{suffix}"


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
        code = _generate_unique_room_code()
        partner_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        item = {
            "PK": f"ROOM#{code}",
            "SK": "METADATA",
            "room_code": code,
            "partner_1_id": partner_id,
            "created_at": now,
            "streaming_services": [],
            "onboarding_complete": False,
        }

        put_item(item)

        return created({
            "room_code": code,
            "partner_id": partner_id,
        })

    except Exception as e:
        print(f"Error creating room: {e}")
        return server_error("Failed to create room")
