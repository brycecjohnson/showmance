"""POST /rooms/{code}/join — Join an existing room as a new member."""

import uuid
from datetime import datetime, timezone

from shared.dynamo import get_item, update_item
from shared.response import success, error, not_found, server_error
from shared.validation import get_path_param, is_valid_room_code


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: EATS-XXXX")

    try:
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        max_members = int(room.get("max_members", 2))
        if int(room.get("member_count", 0)) >= max_members:
            return error("Room is already full", status_code=409)

        member_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        member_number = int(room.get("member_count", 0)) + 1

        # Conditional increment prevents a race where two people join at once
        update_item(
            pk=f"ROOM#{code}",
            sk="METADATA",
            update_expr="SET members.#pid = :info, member_count = member_count + :one",
            expr_values={
                ":info": {"joined_at": now, "number": member_number},
                ":one": 1,
                ":max": max_members,
            },
            expr_names={"#pid": member_id},
            condition_expr="member_count < :max",
        )

        return success({
            "room_code": code,
            "partner_id": member_id,
        })

    except Exception as e:
        error_msg = str(e)
        if "ConditionalCheckFailedException" in error_msg:
            return error("Room is already full", status_code=409)
        print(f"Error joining room: {e}")
        return server_error("Failed to join room")
