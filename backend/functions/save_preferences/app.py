"""POST /rooms/{code}/preferences — Save member cuisine/price preferences.

Partial updates supported: settings sends only price_levels; onboarding sends
cuisines + price_levels. Cuisines are stored per member (PREFS# item);
price_levels also land on the room METADATA (they're a room-level filter).
"""

from datetime import datetime, timezone

from shared.dynamo import get_item, update_item
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, parse_body,
    is_valid_room_code, is_member,
    VALID_CUISINES, VALID_PRICE_LEVELS,
)


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: EATS-XXXX")

    member_id = get_partner_id(event)
    if not member_id:
        return error("Missing X-Partner-Id header")

    body = parse_body(event)
    if body is None:
        return error("Request body is required")

    cuisines_liked = body.get("cuisines_liked")
    cuisines_disliked = body.get("cuisines_disliked")
    price_levels = body.get("price_levels")

    for name, value in (("cuisines_liked", cuisines_liked),
                        ("cuisines_disliked", cuisines_disliked)):
        if value is not None:
            if not isinstance(value, list) or not all(
                isinstance(c, str) and c in VALID_CUISINES for c in value
            ):
                return error(f"{name} must be an array of known cuisine ids")

    if price_levels is not None:
        if not isinstance(price_levels, list) or not all(
            isinstance(p, int) and p in VALID_PRICE_LEVELS for p in price_levels
        ):
            return error("price_levels must be an array of integers 1-4")

    if cuisines_liked is None and cuisines_disliked is None and price_levels is None:
        return error("Nothing to save")

    try:
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        if not is_member(room, member_id):
            return error("You are not a member of this room", status_code=403)

        now = datetime.now(timezone.utc).isoformat()

        # Upsert only the provided fields on the member's PREFS item
        set_parts = ["partner_id = :pid", "updated_at = :now"]
        expr_values = {":pid": member_id, ":now": now}
        if cuisines_liked is not None:
            set_parts.append("cuisines_liked = :cl")
            expr_values[":cl"] = cuisines_liked
        if cuisines_disliked is not None:
            set_parts.append("cuisines_disliked = :cd")
            expr_values[":cd"] = cuisines_disliked

        update_item(
            pk=f"ROOM#{code}",
            sk=f"PREFS#{member_id}",
            update_expr="SET " + ", ".join(set_parts),
            expr_values=expr_values,
        )

        # Price comfort is a room-level filter
        if price_levels is not None:
            update_item(
                pk=f"ROOM#{code}",
                sk="METADATA",
                update_expr="SET price_levels = :pl",
                expr_values={":pl": price_levels},
            )

        return success({
            "message": "Preferences saved",
            "partner_id": member_id,
        })

    except Exception as e:
        print(f"Error saving preferences: {e}")
        return server_error("Failed to save preferences")
