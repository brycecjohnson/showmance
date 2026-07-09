"""GET /rooms/{code} — Get room details and settings."""

from shared.dynamo import get_item
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, is_valid_room_code, is_member,
)
from shared.places import parse_stored_location


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: EATS-XXXX")

    member_id = get_partner_id(event)
    if not member_id:
        return error("Missing X-Partner-Id header")

    try:
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        if not is_member(room, member_id):
            return error("You are not a member of this room", status_code=403)

        members = room.get("members") or {}
        partner_number = int(members[member_id].get("number", 1))
        other_partner_joined = int(room.get("member_count", 1)) > 1

        location = parse_stored_location(room.get("location"))
        radius_m = room.get("radius_m", 8047)

        return success({
            "room_code": room["room_code"],
            "partner_number": partner_number,
            "other_partner_joined": other_partner_joined,
            "created_at": room.get("created_at"),
            "onboarding_complete": room.get("onboarding_complete", False),
            "is_solo": room.get("is_solo", False),
            "location": location,
            "radius_m": int(radius_m),
            "price_levels": [int(p) for p in room.get("price_levels", [])],
        })

    except Exception as e:
        print(f"Error getting room: {e}")
        return server_error("Failed to get room details")
