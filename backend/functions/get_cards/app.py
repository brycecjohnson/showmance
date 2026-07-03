"""GET /cards/{code} — Build the restaurant swipe deck.

Pipeline:
1. Load room (must have a location) + all members' cuisine preferences
2. Pick cuisine groups: intersection of members' likes, falling back to the
   union, falling back to a generic spread (capped for cost control)
3. One cached nearby search per cuisine group (geohash-bucketed, 24h TTL)
4. Merge + dedupe by place_id
5. Drop places anyone's dislikes rule out, filter by room price levels,
   exclude places this member already swiped
6. Rank (rating blended with distance) and return a batch of 20 with photos
"""

from shared.dynamo import get_item, query_pk
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, is_valid_room_code, is_member,
    VALID_CUISINES,
)
from shared import places

BATCH_SIZE = 20
MAX_CUISINE_SEARCHES = 6  # cost cap: nearby searches per deck build
# Default spread when nobody has liked cuisines yet
DEFAULT_CUISINES = ["pizza", "mexican", "burgers", "sushi", "italian", "bbq"]


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
        if not origin:
            return error("Room has no location set", status_code=409)

        radius_m = int(room.get("radius_m", 8047))
        price_levels = {int(p) for p in room.get("price_levels", [])}

        cuisine_ids, disliked = _choose_cuisines(code)

        # One cached search per cuisine group
        seen: dict[str, dict] = {}
        for cuisine_id in cuisine_ids:
            for place in places.nearby_search(
                origin["lat"], origin["lng"], radius_m, cuisine_id
            ):
                card = places.extract_card(place, origin["lat"], origin["lng"])
                if card and card["place_id"] not in seen:
                    seen[card["place_id"]] = card

        pool = list(seen.values())

        # Price filter (cards with unknown price pass through)
        if price_levels:
            pool = [
                c for c in pool
                if c["price_level"] is None or c["price_level"] in price_levels
            ]

        # Drop places matching a cuisine everyone disliked
        if disliked:
            disliked_labels = _labels_for(disliked)
            pool = [
                c for c in pool
                if not set(c["cuisines"]) & disliked_labels
            ]

        # Exclude what this member already swiped
        swiped_item = get_item(f"ROOM#{code}", f"SWIPED#restaurant#{member_id}")
        swiped_ids = set(swiped_item.get("swiped_ids", [])) if swiped_item else set()
        pool = [c for c in pool if c["place_id"] not in swiped_ids]

        # Rank: rating first, gently penalized by distance
        pool.sort(key=_score, reverse=True)

        batch = pool[:BATCH_SIZE]

        # Resolve photos only for the cards we actually return (cached per photo)
        for card in batch:
            photo_name = card.pop("_photo_name", None)
            if photo_name:
                card["photo_url"] = places.resolve_photo_url(photo_name)

        return success({
            "cards": batch,
            "has_more": len(pool) > BATCH_SIZE,
        })

    except Exception as e:
        print(f"Error building deck: {e}")
        return server_error("Failed to load restaurants")


def _choose_cuisines(code: str) -> tuple[list[str], set]:
    """Pick cuisine groups from members' preferences.

    Returns (cuisine ids to search, cuisines disliked by every member).
    """
    prefs_items = query_pk(f"ROOM#{code}", sk_prefix="PREFS#")

    likes = [set(p.get("cuisines_liked", [])) & VALID_CUISINES for p in prefs_items]
    dislikes = [set(p.get("cuisines_disliked", [])) & VALID_CUISINES for p in prefs_items]
    likes = [s for s in likes if s]

    if likes:
        overlap = set.intersection(*likes)
        chosen = overlap if overlap else set.union(*likes)
    else:
        chosen = set()

    # Unanimous dislikes are excluded from results (and never searched)
    disliked_by_all = set.intersection(*dislikes) if dislikes else set()
    chosen -= disliked_by_all

    if not chosen:
        chosen = set(DEFAULT_CUISINES) - disliked_by_all

    # Deterministic order, capped for cost
    return sorted(chosen)[:MAX_CUISINE_SEARCHES], disliked_by_all


def _labels_for(cuisine_ids: set) -> set:
    """Display labels produced by the given cuisine ids' place types."""
    labels = set()
    for cuisine_id in cuisine_ids:
        for place_type in places.CUISINE_PLACE_TYPES.get(cuisine_id, []):
            label = places.TYPE_DISPLAY_NAMES.get(place_type)
            if label:
                labels.add(label)
    return labels


def _score(card: dict) -> float:
    """Rating blended with proximity; unknown-rating places sink."""
    rating = card.get("rating") or 0
    distance = card.get("distance_mi")
    penalty = 0.15 * distance if distance is not None else 0.5
    return rating - penalty
