"""GET /cards/{code} — Content pipeline: returns next batch of swipe cards.

Pipeline steps:
1. Validate room code + partner ID
2. Load room metadata + partner preferences
3. Load swiped set (TMDB IDs already seen by this partner)
4. Query TMDB: trending + discover by genre overlap + recommendations from seed likes
5. Merge, dedupe, filter swiped
6. Score and rank
7. Return batch of 20 cards
"""

from typing import Optional

from shared.dynamo import get_item, query_pk
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, get_query_param,
    is_valid_room_code, is_valid_media_type,
)
from shared.tmdb import (
    get_trending, get_discover, get_recommendations,
    build_discover_params, extract_card_data,
)

BATCH_SIZE = 20


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: SHOW-XXXX")

    partner_id = get_partner_id(event)
    if not partner_id:
        return error("Missing X-Partner-Id header")

    media_type = get_query_param(event, "mode", "movie")
    if not is_valid_media_type(media_type):
        return error("Invalid mode. Must be 'movie' or 'tv'")

    page = int(get_query_param(event, "page", "1"))

    try:
        # Step 1: Load room metadata
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        if partner_id not in (room.get("partner_1_id"), room.get("partner_2_id")):
            return error("You are not a member of this room", status_code=403)

        # Step 2: Load preferences for both partners
        partner_prefs = get_item(f"ROOM#{code}", f"PREFS#{partner_id}")

        # Determine the other partner's ID
        other_partner_id = (
            room.get("partner_2_id")
            if partner_id == room.get("partner_1_id")
            else room.get("partner_1_id")
        )
        other_prefs = None
        if other_partner_id:
            other_prefs = get_item(f"ROOM#{code}", f"PREFS#{other_partner_id}")

        # Step 3: Load swiped set for this partner
        swiped_ids = _load_swiped_set(code, media_type, partner_id)

        # Step 4: Build genre overlap + preferences
        liked_genres = _compute_genre_overlap(partner_prefs, other_prefs)
        eras = _get_eras(partner_prefs, other_prefs)
        streaming_services = room.get("streaming_services", [])

        # Step 5: Fetch content from TMDB
        raw_titles = _fetch_content(
            media_type, liked_genres, eras, streaming_services, partner_prefs, page,
        )

        # Step 6: Dedupe + filter swiped
        filtered = _dedupe_and_filter(raw_titles, swiped_ids)

        # Step 7: Score and rank
        scored = _score_and_rank(filtered, liked_genres)

        # Return batch
        batch = scored[:BATCH_SIZE]

        return success({
            "cards": batch,
            "count": len(batch),
            "has_more": len(scored) > BATCH_SIZE,
        })

    except Exception as e:
        print(f"Error getting cards: {e}")
        return server_error("Failed to load cards")


def _load_swiped_set(code: str, media_type: str, partner_id: str) -> set[int]:
    """Load the compact swiped-ID set for this partner + mode."""
    item = get_item(f"ROOM#{code}", f"SWIPED#{media_type}#{partner_id}")
    if not item:
        return set()
    raw = item.get("swiped_ids", set())
    # DynamoDB Number Sets come back as sets of Decimal
    return {int(x) for x in raw}


def _compute_genre_overlap(
    prefs1: Optional[dict], prefs2: Optional[dict],
) -> list[int]:
    """Compute genre overlap between two partners' preferences.

    Returns overlapping liked genres first, then remaining liked genres.
    If only one partner has prefs, use theirs. If neither, return empty.
    """
    if not prefs1 and not prefs2:
        return []

    liked1 = set(prefs1.get("liked_genres", [])) if prefs1 else set()
    liked2 = set(prefs2.get("liked_genres", [])) if prefs2 else set()

    if not liked1 and not liked2:
        return []
    if not liked1:
        return [int(g) for g in liked2]
    if not liked2:
        return [int(g) for g in liked1]

    # Overlap first, then remaining
    overlap = liked1 & liked2
    remaining = (liked1 | liked2) - overlap
    return [int(g) for g in overlap] + [int(g) for g in remaining]


def _get_eras(prefs1: Optional[dict], prefs2: Optional[dict]) -> list[str]:
    """Get era preferences, preferring overlap."""
    eras1 = set(prefs1.get("eras", [])) if prefs1 else set()
    eras2 = set(prefs2.get("eras", [])) if prefs2 else set()

    if not eras1 and not eras2:
        return ["all"]
    if not eras1:
        return list(eras2)
    if not eras2:
        return list(eras1)

    overlap = eras1 & eras2
    return list(overlap) if overlap else list(eras1 | eras2)


def _fetch_content(
    media_type: str,
    liked_genres: list[int],
    eras: list[str],
    streaming_services: list[str],
    partner_prefs: Optional[dict],
    page: int,
) -> list[dict]:
    """Fetch content from multiple TMDB sources and merge."""
    all_titles: list[dict] = []

    # Source 1: Trending (always include — high recognition, fresh content)
    trending = get_trending(media_type, page=page)
    if trending:
        for item in trending.get("results", []):
            if item.get("poster_path"):
                card = extract_card_data(item, media_type)
                card["_source"] = "trending"
                all_titles.append(card)

    # Source 2: Discover by genre overlap with streaming/era filters
    if liked_genres:
        discover_params = build_discover_params(
            genre_ids=liked_genres[:5],
            eras=eras,
            streaming_services=streaming_services,
        )
        discover = get_discover(media_type, params=discover_params, page=page)
        if discover:
            for item in discover.get("results", []):
                if item.get("poster_path"):
                    card = extract_card_data(item, media_type)
                    card["_source"] = "discover_overlap"
                    all_titles.append(card)

        # Source 3: Discover by individual top genres (diversify)
        for genre_id in liked_genres[:3]:
            genre_params = build_discover_params(
                genre_ids=[genre_id],
                eras=eras,
                streaming_services=streaming_services,
                sort_by="vote_average.desc",
                min_vote_count=100,
            )
            genre_data = get_discover(media_type, params=genre_params, page=page)
            if genre_data:
                for item in genre_data.get("results", [])[:5]:
                    if item.get("poster_path"):
                        card = extract_card_data(item, media_type)
                        card["_source"] = "discover_genre"
                        all_titles.append(card)

    # Source 4: Recommendations from seed title likes
    if partner_prefs:
        seed_likes = partner_prefs.get("seed_likes", [])
        for seed_id in seed_likes[:3]:
            recs = get_recommendations(media_type, int(seed_id))
            if recs:
                for item in recs.get("results", [])[:5]:
                    if item.get("poster_path"):
                        card = extract_card_data(item, media_type)
                        card["_source"] = "recommendation"
                        all_titles.append(card)

    return all_titles


def _dedupe_and_filter(titles: list[dict], swiped_ids: set[int]) -> list[dict]:
    """Remove duplicates and already-swiped titles."""
    seen: set[int] = set()
    result: list[dict] = []

    for card in titles:
        tmdb_id = card.get("tmdb_id")
        if tmdb_id is None:
            continue
        if tmdb_id in swiped_ids:
            continue
        if tmdb_id in seen:
            continue
        seen.add(tmdb_id)
        result.append(card)

    return result


def _score_and_rank(titles: list[dict], liked_genres: list[int]) -> list[dict]:
    """Score titles and return sorted by relevance.

    Scoring factors:
    - Genre match: +2 per overlapping genre (overlap genres weighted higher)
    - Popularity: normalized 0-1 bonus
    - Source bonus: recommendations > discover_overlap > discover_genre > trending
    - Rating: bonus for well-rated titles
    """
    if not titles:
        return []

    overlap_genres = set(liked_genres[:5]) if liked_genres else set()
    source_scores = {
        "recommendation": 3,
        "discover_overlap": 2,
        "discover_genre": 1,
        "trending": 0.5,
    }

    max_pop = max((t.get("popularity", 0) for t in titles), default=1) or 1

    scored: list[dict] = []
    for card in titles:
        score = 0.0

        # Genre overlap bonus
        card_genres = set(card.get("genre_ids", []))
        genre_matches = len(card_genres & overlap_genres)
        score += genre_matches * 2

        # Source bonus
        score += source_scores.get(card.get("_source", ""), 0)

        # Popularity bonus (normalized 0-1)
        score += card.get("popularity", 0) / max_pop

        # Rating bonus (0-2 range)
        vote_avg = card.get("rating", 0)
        if vote_avg >= 7:
            score += (vote_avg - 5) / 2.5

        card["_score"] = round(score, 2)
        scored.append(card)

    # Sort by score descending
    scored.sort(key=lambda t: t["_score"], reverse=True)

    # Clean internal fields before returning
    for card in scored:
        card.pop("_source", None)
        card.pop("_score", None)

    return scored
