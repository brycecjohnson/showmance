"""GET /matches/{code} — Get all matches for a room.

Queries GSI1 for matches sorted by matched_at (newest first). Matches carry a
display snapshot written at match time; snapshots older than 30 days are
lazily refreshed from (cached) Place Details to stay inside Google's ToS.
"""

from datetime import datetime, timedelta, timezone

from shared.dynamo import get_item, query_gsi1, update_item
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, is_valid_room_code, is_member,
)
from shared import places
from shared.matches import match_to_response

SNAPSHOT_MAX_AGE_DAYS = 30
MAX_REFRESHES_PER_REQUEST = 10  # bound latency on old match lists


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

        origin = places.parse_stored_location(room.get("location"))

        gsi1pk = f"ROOM#{code}#MATCHES#restaurant"
        items = query_gsi1(gsi1pk, scan_forward=False)

        items = _refresh_stale_snapshots(code, items)

        matches = [match_to_response(item, origin) for item in items]

        return success({
            "room_code": code,
            "matches": matches,
            "count": len(matches),
        })

    except Exception as e:
        print(f"Error getting matches: {e}")
        return server_error("Failed to get matches")


def _refresh_stale_snapshots(code: str, items: list[dict]) -> list[dict]:
    """Refresh display snapshots older than the ToS cap from Place Details."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=SNAPSHOT_MAX_AGE_DAYS)
    refreshed = 0
    out = []

    for item in items:
        if refreshed < MAX_REFRESHES_PER_REQUEST and _is_stale(item, cutoff):
            fresh = _refresh_snapshot(code, item)
            if fresh is not None:
                item = fresh
                refreshed += 1
        out.append(item)

    return out


def _is_stale(item: dict, cutoff: datetime) -> bool:
    snapshot_at = item.get("snapshot_at")
    if not snapshot_at:
        return True
    try:
        return datetime.fromisoformat(str(snapshot_at)) < cutoff
    except ValueError:
        return True


def _refresh_snapshot(code: str, item: dict):
    """Pull fresh display data for one match. Returns updated item or None."""
    place_id = item.get("place_id")
    details = places.get_place_details(place_id)
    if not details:
        return None

    card = places.extract_card(details, 0, 0)
    if not card:
        return None

    photo_url = item.get("photo_url")
    if card.get("_photo_name"):
        photo_url = places.resolve_photo_url(card["_photo_name"]) or photo_url

    now = datetime.now(timezone.utc).isoformat()
    updates = {
        "name": card["name"],
        "photo_url": photo_url,
        "rating": str(card["rating"]),
        "price_level": card["price_level"],
        "cuisines": card["cuisines"],
        "address": card["address"],
        "lat": str(card["lat"]) if card.get("lat") is not None else None,
        "lng": str(card["lng"]) if card.get("lng") is not None else None,
        "maps_url": card.get("maps_url"),
        "snapshot_at": now,
    }

    set_parts = []
    expr_values = {}
    expr_names = {}
    for i, (field, value) in enumerate(updates.items()):
        if value is None:
            continue
        set_parts.append(f"#f{i} = :v{i}")
        expr_names[f"#f{i}"] = field
        expr_values[f":v{i}"] = value

    update_item(
        pk=f"ROOM#{code}",
        sk=f"MATCH#restaurant#{place_id}",
        update_expr="SET " + ", ".join(set_parts),
        expr_values=expr_values,
        expr_names=expr_names,
    )

    merged = {**item, **{k: v for k, v in updates.items() if v is not None}}
    return merged
