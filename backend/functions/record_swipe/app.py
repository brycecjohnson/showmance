"""POST /swipe — Record a swipe, update swiped set, detect matches.

Flow:
1. Validate input (room_code, partner_id, tmdb_id, media_type, direction)
2. Write SWIPE# entity (individual swipe record)
3. Atomic ADD tmdb_id to SWIPED# set (compact seen-state)
4. If direction is "right", check if partner also swiped right (GetItem)
5. If both right, create MATCH# entity
6. Return swipe result + match status
"""

from datetime import datetime, timezone

from shared.dynamo import get_item, put_item, atomic_add_to_set
from shared.response import success, created, error, not_found, server_error
from shared.validation import (
    get_partner_id, parse_body,
    is_valid_room_code, is_valid_uuid, is_valid_media_type,
)


def handler(event, context):
    partner_id = get_partner_id(event)
    if not partner_id:
        return error("Missing X-Partner-Id header")

    body = parse_body(event)
    if not body:
        return error("Request body is required")

    room_code = body.get("room_code")
    tmdb_id = body.get("tmdb_id")
    media_type = body.get("media_type")
    direction = body.get("direction")
    title = body.get("title", "")
    poster_path = body.get("poster_path", "")
    year = body.get("year", "")

    # Validate required fields
    if not room_code or not is_valid_room_code(room_code):
        return error("Invalid room_code. Expected format: SHOW-XXXX")

    if tmdb_id is None:
        return error("tmdb_id is required")
    try:
        tmdb_id = int(tmdb_id)
    except (ValueError, TypeError):
        return error("tmdb_id must be a number")

    if not media_type or not is_valid_media_type(media_type):
        return error("media_type must be 'movie' or 'tv'")

    if direction not in ("right", "left"):
        return error("direction must be 'right' or 'left'")

    try:
        # Verify room exists and partner is a member
        room = get_item(f"ROOM#{room_code}", "METADATA")
        if not room:
            return not_found(f"Room {room_code} not found")

        if partner_id not in (room.get("partner_1_id"), room.get("partner_2_id")):
            return error("You are not a member of this room", status_code=403)

        now = datetime.now(timezone.utc).isoformat()

        # Step 1: Write individual swipe record
        swipe_item = {
            "PK": f"ROOM#{room_code}",
            "SK": f"SWIPE#{media_type}#{tmdb_id}#{partner_id}",
            "room_code": room_code,
            "partner_id": partner_id,
            "tmdb_id": tmdb_id,
            "media_type": media_type,
            "direction": direction,
            "title": title,
            "swiped_at": now,
        }
        put_item(swipe_item)

        # Step 2: Atomic ADD to swiped set (compact seen-state)
        atomic_add_to_set(
            pk=f"ROOM#{room_code}",
            sk=f"SWIPED#{media_type}#{partner_id}",
            attribute="swiped_ids",
            values={tmdb_id},
        )

        # Step 3: Match detection (only for right swipes)
        matched = False
        is_solo = room.get("is_solo", False)

        if direction == "right":
            if is_solo:
                # Solo mode: every right swipe is auto-matched
                matched = True
                _create_match(
                    room_code, tmdb_id, media_type, title, poster_path, year, now,
                )
            else:
                # Couples mode: check if partner also swiped right
                other_partner_id = (
                    room.get("partner_2_id")
                    if partner_id == room.get("partner_1_id")
                    else room.get("partner_1_id")
                )

                if other_partner_id:
                    # Check if the other partner also swiped right on this title
                    other_swipe = get_item(
                        f"ROOM#{room_code}",
                        f"SWIPE#{media_type}#{tmdb_id}#{other_partner_id}",
                    )
                    if other_swipe and other_swipe.get("direction") == "right":
                        matched = True
                        _create_match(
                            room_code, tmdb_id, media_type, title, poster_path, year, now,
                        )

        result = {
            "swipe": "recorded",
            "direction": direction,
            "tmdb_id": tmdb_id,
            "matched": matched,
        }

        if matched:
            result["match"] = {
                "tmdb_id": tmdb_id,
                "media_type": media_type,
                "title": title,
                "poster_path": poster_path,
                "matched_at": now,
            }

        return created(result)

    except Exception as e:
        print(f"Error recording swipe: {e}")
        return server_error("Failed to record swipe")


def _create_match(
    room_code: str,
    tmdb_id: int,
    media_type: str,
    title: str,
    poster_path: str,
    year: str,
    matched_at: str,
) -> None:
    """Create a MATCH entity when both partners swipe right."""
    match_item = {
        "PK": f"ROOM#{room_code}",
        "SK": f"MATCH#{media_type}#{tmdb_id}",
        "room_code": room_code,
        "tmdb_id": tmdb_id,
        "media_type": media_type,
        "title": title,
        "poster_path": poster_path,
        "year": year,
        "matched_at": matched_at,
        "watched": False,
        # GSI1 for sorted match queries
        "GSI1PK": f"ROOM#{room_code}#MATCHES#{media_type}",
        "GSI1SK": matched_at,
    }
    put_item(match_item)
