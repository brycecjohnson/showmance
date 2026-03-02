"""POST /rooms/{code}/preferences — Save partner genre/era preferences."""

from datetime import datetime, timezone

from shared.dynamo import get_item, put_item
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, parse_body,
    is_valid_room_code, is_valid_uuid,
)


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: SHOW-XXXX")

    partner_id = get_partner_id(event)
    if not partner_id:
        return error("Missing X-Partner-Id header")

    body = parse_body(event)
    if not body:
        return error("Request body is required")

    try:
        # Verify room exists and partner is a member
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        if partner_id not in (room.get("partner_1_id"), room.get("partner_2_id")):
            return error("You are not a member of this room", status_code=403)

        # Validate preferences
        liked_genres = body.get("liked_genres", [])
        disliked_genres = body.get("disliked_genres", [])
        eras = body.get("eras", [])
        streaming_services = body.get("streaming_services")

        if not isinstance(liked_genres, list) or not isinstance(disliked_genres, list):
            return error("liked_genres and disliked_genres must be arrays")

        if not isinstance(eras, list):
            return error("eras must be an array")

        now = datetime.now(timezone.utc).isoformat()

        # Save preferences for this partner
        prefs_item = {
            "PK": f"ROOM#{code}",
            "SK": f"PREFS#{partner_id}",
            "partner_id": partner_id,
            "liked_genres": liked_genres,
            "disliked_genres": disliked_genres,
            "eras": eras,
            "updated_at": now,
        }

        put_item(prefs_item)

        # If streaming services were provided, update the room-level setting
        if streaming_services is not None:
            if not isinstance(streaming_services, list):
                return error("streaming_services must be an array")

            from shared.dynamo import update_item
            update_item(
                pk=f"ROOM#{code}",
                sk="METADATA",
                update_expr="SET streaming_services = :ss",
                expr_values={":ss": streaming_services},
            )

        return success({
            "message": "Preferences saved",
            "partner_id": partner_id,
        })

    except Exception as e:
        print(f"Error saving preferences: {e}")
        return server_error("Failed to save preferences")
