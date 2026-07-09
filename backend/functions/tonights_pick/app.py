"""GET /tonight/{code} — Random pick from unvisited matches.

Queries GSI1 for all restaurant matches, filters to unvisited only,
and returns one at random. Returns 404 if no unvisited matches exist.
"""

import random

from shared.dynamo import get_item, query_gsi1
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, is_valid_room_code, is_member,
)
from shared.places import parse_stored_location
from shared.matches import match_to_response


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

        gsi1pk = f"ROOM#{code}#MATCHES#restaurant"
        items = query_gsi1(gsi1pk)

        unvisited = [item for item in items if not item.get("visited", False)]

        if not unvisited:
            return not_found(
                "No unvisited matches yet! Keep swiping to find places you both crave."
            )

        pick = random.choice(unvisited)
        origin = parse_stored_location(room.get("location"))

        return success({"match": match_to_response(pick, origin)})

    except Exception as e:
        print(f"Error picking tonight's spot: {e}")
        return server_error("Failed to pick a spot")
