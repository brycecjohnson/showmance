"""GET /tonight/{code}?mode=movie|tv — Random pick from unwatched matches.

Queries GSI1 for all matches of the given mode, filters to unwatched only,
and returns one at random. Returns 404 if no unwatched matches exist.
"""

import random

from shared.dynamo import get_item, query_gsi1
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_query_param, get_partner_id,
    is_valid_room_code, is_valid_media_type,
)


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: SHOW-XXXX")

    partner_id = get_partner_id(event)
    if not partner_id:
        return error("Missing X-Partner-Id header")

    mode = get_query_param(event, "mode", "movie")
    if not is_valid_media_type(mode):
        return error("mode must be 'movie' or 'tv'")

    try:
        # Verify room exists and partner is a member
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        if partner_id not in (room.get("partner_1_id"), room.get("partner_2_id")):
            return error("You are not a member of this room", status_code=403)

        # Query all matches for this mode
        gsi1pk = f"ROOM#{code}#MATCHES#{mode}"
        items = query_gsi1(gsi1pk)

        # Filter to unwatched only
        unwatched = [item for item in items if not item.get("watched", False)]

        if not unwatched:
            return not_found(
                "No unwatched matches yet! Keep swiping to find things you both love."
            )

        # Pick one at random
        pick = random.choice(unwatched)

        return success({
            "tmdb_id": pick["tmdb_id"],
            "title": pick.get("title", ""),
            "poster_path": pick.get("poster_path", ""),
            "media_type": pick.get("media_type", mode),
            "matched_at": pick.get("matched_at", ""),
            "release_year": pick.get("release_year", pick.get("year", "")),
            "genre_names": pick.get("genre_names", []),
            "streaming_services": pick.get("streaming_services", []),
        })

    except Exception as e:
        print(f"Error getting tonight's pick: {e}")
        return server_error("Failed to get tonight's pick")
