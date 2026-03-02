"""GET /rooms/{code} — Get room details and settings."""

from shared.dynamo import get_item
from shared.response import success, error, not_found, server_error
from shared.validation import get_path_param, get_partner_id, is_valid_room_code


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: SHOW-XXXX")

    partner_id = get_partner_id(event)
    if not partner_id:
        return error("Missing X-Partner-Id header")

    try:
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        # Verify the requester is a member of this room
        if partner_id not in (room.get("partner_1_id"), room.get("partner_2_id")):
            return error("You are not a member of this room", status_code=403)

        # Determine partner role
        is_partner_1 = partner_id == room.get("partner_1_id")
        partner_number = 1 if is_partner_1 else 2
        other_partner_joined = room.get("partner_2_id") is not None if is_partner_1 else True

        return success({
            "room_code": room["room_code"],
            "partner_number": partner_number,
            "other_partner_joined": other_partner_joined,
            "created_at": room.get("created_at"),
            "streaming_services": room.get("streaming_services", []),
            "onboarding_complete": room.get("onboarding_complete", False),
        })

    except Exception as e:
        print(f"Error getting room: {e}")
        return server_error("Failed to get room details")
