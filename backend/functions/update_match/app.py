"""PATCH /matches/{code}/{tmdb_id} — Update a match (mark watched/unwatched).

Body: { "watched": boolean, "media_type": "movie"|"tv" }
Sets watched flag and watched_at timestamp on the MATCH entity.
"""

from datetime import datetime, timezone

from shared.dynamo import get_item, update_item
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, parse_body,
    is_valid_room_code, is_valid_media_type,
)


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: SHOW-XXXX")

    tmdb_id = get_path_param(event, "tmdb_id")
    if not tmdb_id:
        return error("tmdb_id is required")
    try:
        tmdb_id = int(tmdb_id)
    except (ValueError, TypeError):
        return error("tmdb_id must be a number")

    partner_id = get_partner_id(event)
    if not partner_id:
        return error("Missing X-Partner-Id header")

    body = parse_body(event)
    if not body:
        return error("Request body is required")

    media_type = body.get("media_type")
    if not media_type or not is_valid_media_type(media_type):
        return error("media_type must be 'movie' or 'tv'")

    watched = body.get("watched")
    if watched is None or not isinstance(watched, bool):
        return error("watched must be a boolean")

    try:
        # Verify room exists and partner is a member
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        if partner_id not in (room.get("partner_1_id"), room.get("partner_2_id")):
            return error("You are not a member of this room", status_code=403)

        # Verify the match exists
        match_sk = f"MATCH#{media_type}#{tmdb_id}"
        match_item = get_item(f"ROOM#{code}", match_sk)
        if not match_item:
            return not_found(f"Match not found for tmdb_id {tmdb_id}")

        # Build update expression
        now = datetime.now(timezone.utc).isoformat()

        if watched:
            update_expr = "SET watched = :w, watched_at = :wat"
            expr_values = {":w": True, ":wat": now}
        else:
            update_expr = "SET watched = :w REMOVE watched_at"
            expr_values = {":w": False}

        result = update_item(
            pk=f"ROOM#{code}",
            sk=match_sk,
            update_expr=update_expr,
            expr_values=expr_values,
        )

        updated = result.get("Attributes", {})

        return success({
            "tmdb_id": updated.get("tmdb_id", tmdb_id),
            "title": updated.get("title", ""),
            "media_type": updated.get("media_type", media_type),
            "watched": updated.get("watched", watched),
            "watched_at": updated.get("watched_at"),
        })

    except Exception as e:
        print(f"Error updating match: {e}")
        return server_error("Failed to update match")
