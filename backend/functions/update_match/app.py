"""PATCH /matches/{code}/{place_id} — Update a match (mark visited/unvisited).

Body: { "visited": boolean }
Sets visited flag and visited_at timestamp on the MATCH entity.
"""

from datetime import datetime, timezone

from shared.dynamo import get_item, update_item
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, parse_body,
    is_valid_room_code, is_valid_place_id, is_member,
)


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: EATS-XXXX")

    place_id = get_path_param(event, "place_id")
    if not is_valid_place_id(place_id):
        return error("place_id is required")

    member_id = get_partner_id(event)
    if not member_id:
        return error("Missing X-Partner-Id header")

    body = parse_body(event)
    if not body:
        return error("Request body is required")

    visited = body.get("visited")
    if visited is None or not isinstance(visited, bool):
        return error("visited must be a boolean")

    try:
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        if not is_member(room, member_id):
            return error("You are not a member of this room", status_code=403)

        match_sk = f"MATCH#restaurant#{place_id}"
        match_item = get_item(f"ROOM#{code}", match_sk)
        if not match_item:
            return not_found(f"Match not found for place {place_id}")

        now = datetime.now(timezone.utc).isoformat()

        if visited:
            update_expr = "SET visited = :v, visited_at = :vat"
            expr_values = {":v": True, ":vat": now}
        else:
            update_expr = "SET visited = :v REMOVE visited_at"
            expr_values = {":v": False}

        result = update_item(
            pk=f"ROOM#{code}",
            sk=match_sk,
            update_expr=update_expr,
            expr_values=expr_values,
        )

        updated = result.get("Attributes", {})

        return success({
            "place_id": updated.get("place_id", place_id),
            "name": updated.get("name", ""),
            "visited": updated.get("visited", visited),
            "visited_at": updated.get("visited_at"),
        })

    except Exception as e:
        print(f"Error updating match: {e}")
        return server_error("Failed to update match")
