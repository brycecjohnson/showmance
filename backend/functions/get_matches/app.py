"""GET /matches/{code}?mode=movie|tv — Get all matches for a room.

Queries GSI1 for matches sorted by matched_at. Supports filtering by mode (media_type).
Returns match details including watched status, rating, and metadata.
"""

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

        # Query GSI1 for matches sorted by matched_at (newest first)
        gsi1pk = f"ROOM#{code}#MATCHES#{mode}"
        items = query_gsi1(gsi1pk, scan_forward=False)

        matches = [
            {
                "tmdb_id": item["tmdb_id"],
                "title": item.get("title", ""),
                "poster_path": item.get("poster_path", ""),
                "media_type": item.get("media_type", mode),
                "matched_at": item.get("matched_at", ""),
                "watched": item.get("watched", False),
                "watched_at": item.get("watched_at"),
                "rating": item.get("rating"),
                "release_year": item.get("release_year", item.get("year", "")),
                "genre_names": item.get("genre_names", []),
                "streaming_services": item.get("streaming_services", []),
            }
            for item in items
        ]

        return success({
            "room_code": code,
            "mode": mode,
            "matches": matches,
            "count": len(matches),
        })

    except Exception as e:
        print(f"Error getting matches: {e}")
        return server_error("Failed to get matches")
