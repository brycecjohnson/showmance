"""POST /swipe — Record a swipe, update swiped set, detect matches.

Flow:
1. Validate input (room_code, member id, place_id, direction)
2. Write SWIPE# entity (individual swipe record)
3. Atomic ADD place_id to SWIPED# set (compact seen-state)
4. If direction is "right", count right-swipes for this place across members —
   when every member has swiped right, it's a match (group-ready rule; solo
   rooms auto-match)
5. Create MATCH# entity with a display snapshot from the swipe payload
6. Return swipe result + match status
"""

from datetime import datetime, timezone

from shared.dynamo import get_item, put_item, query_pk, atomic_add_to_set
from shared.response import created, error, not_found, server_error
from shared.validation import (
    get_partner_id, parse_body,
    is_valid_room_code, is_valid_place_id, is_member,
)

# Snapshot fields the frontend sends with a right swipe, persisted onto the
# match so the list renders without extra Places calls. Refreshed by
# get_matches when older than 30 days (Google ToS).
SNAPSHOT_FIELDS = (
    "name", "photo_url", "rating", "price_level", "cuisines",
    "address", "lat", "lng", "maps_url",
)


def handler(event, context):
    member_id = get_partner_id(event)
    if not member_id:
        return error("Missing X-Partner-Id header")

    body = parse_body(event)
    if not body:
        return error("Request body is required")

    room_code = body.get("room_code")
    place_id = body.get("place_id")
    direction = body.get("direction")

    if not room_code or not is_valid_room_code(room_code):
        return error("Invalid room_code. Expected format: EATS-XXXX")

    if not is_valid_place_id(place_id):
        return error("place_id is required")

    if direction not in ("right", "left"):
        return error("direction must be 'right' or 'left'")

    try:
        room = get_item(f"ROOM#{room_code}", "METADATA")
        if not room:
            return not_found(f"Room {room_code} not found")

        if not is_member(room, member_id):
            return error("You are not a member of this room", status_code=403)

        now = datetime.now(timezone.utc).isoformat()

        # Step 1: Write individual swipe record
        swipe_item = {
            "PK": f"ROOM#{room_code}",
            "SK": f"SWIPE#restaurant#{place_id}#{member_id}",
            "room_code": room_code,
            "partner_id": member_id,
            "place_id": place_id,
            "direction": direction,
            "name": body.get("name", ""),
            "swiped_at": now,
        }
        put_item(swipe_item)

        # Step 2: Atomic ADD to swiped set (compact seen-state)
        atomic_add_to_set(
            pk=f"ROOM#{room_code}",
            sk=f"SWIPED#restaurant#{member_id}",
            attribute="swiped_ids",
            values={place_id},
        )

        # Step 3: Match detection (only for right swipes)
        matched = False

        if direction == "right":
            member_count = int(room.get("member_count", 1))
            if room.get("is_solo", False):
                matched = True
            elif member_count >= 2:
                # Group-ready rule: match when every member has swiped right.
                # Consistent read: match detection must see the partner's
                # just-written swipe immediately, not on the next eventually-
                # consistent replica — otherwise simultaneous right-swipes can
                # each miss the other and the match is silently never created.
                swipes = query_pk(
                    f"ROOM#{room_code}",
                    sk_prefix=f"SWIPE#restaurant#{place_id}#",
                    consistent=True,
                )
                right_swipers = {
                    s["partner_id"] for s in swipes
                    if s.get("direction") == "right"
                }
                matched = len(right_swipers) >= member_count
            # else: non-solo room with only 1 member joined so far (partner
            # hasn't accepted the invite) — there's no one to mutually match
            # with yet, so `matched` stays False.

            if matched:
                _create_match(room_code, place_id, body, now)

        result = {
            "swipe": "recorded",
            "direction": direction,
            "place_id": place_id,
            "matched": matched,
        }

        if matched:
            result["match"] = {
                "place_id": place_id,
                "name": body.get("name", ""),
                "photo_url": body.get("photo_url"),
                "matched_at": now,
            }

        return created(result)

    except Exception as e:
        print(f"Error recording swipe: {e}")
        return server_error("Failed to record swipe")


def _to_dynamo_safe(value):
    """DynamoDB rejects float — stringify them (parsed back on read)."""
    if isinstance(value, float):
        return str(value)
    return value


def _create_match(room_code: str, place_id: str, body: dict, matched_at: str) -> None:
    """Create a MATCH entity with a display snapshot."""
    match_item = {
        "PK": f"ROOM#{room_code}",
        "SK": f"MATCH#restaurant#{place_id}",
        "room_code": room_code,
        "place_id": place_id,
        "matched_at": matched_at,
        "visited": False,
        "snapshot_at": matched_at,
        # GSI1 for sorted match queries
        "GSI1PK": f"ROOM#{room_code}#MATCHES#restaurant",
        "GSI1SK": matched_at,
    }
    for field in SNAPSHOT_FIELDS:
        if body.get(field) is not None:
            match_item[field] = _to_dynamo_safe(body[field])
    put_item(match_item)
