"""POST /rooms/{code}/join — Join an existing room as partner_2."""

import uuid

from shared.dynamo import get_item, update_item
from shared.response import success, error, not_found, server_error
from shared.validation import get_path_param, is_valid_room_code


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: SHOW-XXXX")

    try:
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        # Check if room is already full
        if room.get("partner_2_id"):
            return error("Room is already full", status_code=409)

        partner_id = str(uuid.uuid4())

        # Conditionally update only if partner_2_id is still empty
        # This prevents a race condition where two people try to join simultaneously
        update_item(
            pk=f"ROOM#{code}",
            sk="METADATA",
            update_expr="SET partner_2_id = :pid",
            expr_values={":pid": partner_id},
            condition_expr="attribute_not_exists(partner_2_id)",
        )

        return success({
            "room_code": code,
            "partner_id": partner_id,
        })

    except Exception as e:
        error_msg = str(e)
        if "ConditionalCheckFailedException" in error_msg:
            return error("Room is already full", status_code=409)
        print(f"Error joining room: {e}")
        return server_error("Failed to join room")
