"""Deck builder: nearby search stubs, dedupe, filters, ranking, caching."""

import json

import shared.places as places
from conftest import load_handler, make_event, body_of


def fake_place(place_id, name, types, rating=4.5, count=500, price="PRICE_LEVEL_MODERATE",
               lat=30.2660, lng=-97.7430, photo=True):
    p = {
        "id": place_id,
        "displayName": {"text": name},
        "types": types + ["restaurant"],
        "location": {"latitude": lat, "longitude": lng},
        "rating": rating,
        "userRatingCount": count,
        "priceLevel": price,
        "shortFormattedAddress": f"{name} St, Austin, TX",
        "currentOpeningHours": {"openNow": True},
    }
    if photo:
        p["photos"] = [{"name": f"places/{place_id}/photos/abc"}]
    return p


NEARBY_RESPONSES = {
    "thai_restaurant": [
        fake_place("p-thai-1", "Bangkok Alley", ["thai_restaurant"], rating=4.7),
        fake_place("p-shared", "Fusion House", ["thai_restaurant", "sushi_restaurant"], rating=4.2),
        fake_place("p-thai-expensive", "Thai Royale", ["thai_restaurant"],
                   rating=4.9, price="PRICE_LEVEL_VERY_EXPENSIVE"),
        # 5 distinct types before the "restaurant" fake_place() always appends
        # -> extract_card's display "cuisines" truncates to 3 labels, dropping
        # "ramen_restaurant". A label-based dislike filter would miss this.
        fake_place("p-thai-many-types", "Noodle Empire",
                   ["thai_restaurant", "vietnamese_restaurant", "korean_restaurant",
                    "ramen_restaurant"], rating=4.6),
        fake_place("p-thai-free", "Free Samples Thai", ["thai_restaurant"],
                   rating=4.0, price="PRICE_LEVEL_FREE"),
    ],
    "sushi_restaurant": [
        fake_place("p-sushi-1", "Kaiyo", ["sushi_restaurant"], rating=4.8),
        fake_place("p-shared", "Fusion House", ["thai_restaurant", "sushi_restaurant"], rating=4.2),
    ],
}


def install_google_stub(monkeypatch, counters=None):
    counters = counters if counters is not None else {}

    def fake_http(url, method="GET", body=None, headers=None):
        counters.setdefault("calls", []).append(url)
        if "searchNearby" in url:
            included = body["includedTypes"]
            out = []
            seen = set()
            for t in included:
                for p in NEARBY_RESPONSES.get(t, []):
                    if p["id"] not in seen:
                        seen.add(p["id"])
                        out.append(p)
            return {"places": out}
        if "/media" in url:
            return {"photoUri": "https://lh3.googleusercontent.com/photo123"}
        return None

    monkeypatch.setattr(places, "_http_json", fake_http)
    return counters


def save_prefs(code, member_id, liked, disliked=None, prices=None):
    handler = load_handler("save_preferences")
    body = {"cuisines_liked": liked, "cuisines_disliked": disliked or []}
    if prices is not None:
        body["price_levels"] = prices
    handler(make_event(body=body, path_params={"code": code}, member_id=member_id), None)


def get_cards(code, member_id):
    handler = load_handler("get_cards")
    return handler(make_event(path_params={"code": code}, member_id=member_id), None)


def test_deck_requires_location(room):
    code, member_a, _b = room
    resp = get_cards(code, member_a)
    assert resp["statusCode"] == 409


def test_deck_merges_dedupes_and_ranks(located_room, monkeypatch):
    code, member_a, member_b = located_room
    install_google_stub(monkeypatch)

    # Overlap: thai. Union would add sushi; intersection wins.
    save_prefs(code, member_a, ["thai", "sushi"])
    save_prefs(code, member_b, ["thai"])

    data = body_of(get_cards(code, member_a))
    ids = [c["place_id"] for c in data["cards"]]

    # Only thai group searched (intersection) — sushi-only places absent
    assert "p-thai-1" in ids
    assert "p-sushi-1" not in ids
    assert ids.count("p-shared") == 1  # deduped

    # Ranked by score: Thai Royale 4.9 > Bangkok Alley 4.7 (same distance)
    assert ids.index("p-thai-expensive") < ids.index("p-thai-1")

    # Card shape
    card = data["cards"][0]
    assert card["photo_url"] == "https://lh3.googleusercontent.com/photo123"
    assert card["distance_mi"] is not None
    assert card["open_now"] is True
    assert "_photo_name" not in card
    assert "Thai" in data["cards"][0]["cuisines"] or "Sushi" in data["cards"][0]["cuisines"]


def test_union_when_no_overlap(located_room, monkeypatch):
    code, member_a, member_b = located_room
    install_google_stub(monkeypatch)

    save_prefs(code, member_a, ["thai"])
    save_prefs(code, member_b, ["sushi"])

    data = body_of(get_cards(code, member_a))
    ids = {c["place_id"] for c in data["cards"]}
    assert "p-thai-1" in ids and "p-sushi-1" in ids


def test_price_filter(located_room, monkeypatch):
    code, member_a, member_b = located_room
    install_google_stub(monkeypatch)

    save_prefs(code, member_a, ["thai"], prices=[1, 2])
    save_prefs(code, member_b, ["thai"])

    data = body_of(get_cards(code, member_a))
    ids = {c["place_id"] for c in data["cards"]}
    assert "p-thai-expensive" not in ids  # $$$$ filtered by [1,2]
    assert "p-thai-1" in ids


def test_swiped_places_excluded(located_room, monkeypatch):
    code, member_a, member_b = located_room
    install_google_stub(monkeypatch)
    save_prefs(code, member_a, ["thai"])
    save_prefs(code, member_b, ["thai"])

    swipe = load_handler("record_swipe")
    swipe(make_event(body={"room_code": code, "place_id": "p-thai-1",
                           "direction": "left", "name": "Bangkok Alley"},
                     member_id=member_a), None)

    data = body_of(get_cards(code, member_a))
    ids = {c["place_id"] for c in data["cards"]}
    assert "p-thai-1" not in ids

    # ...but the other member still sees it
    data_b = body_of(get_cards(code, member_b))
    ids_b = {c["place_id"] for c in data_b["cards"]}
    assert "p-thai-1" in ids_b


def test_nearby_results_cached_across_calls(located_room, monkeypatch):
    code, member_a, member_b = located_room
    counters = install_google_stub(monkeypatch)
    save_prefs(code, member_a, ["thai"])
    save_prefs(code, member_b, ["thai"])

    get_cards(code, member_a)
    nearby_calls_first = sum(1 for u in counters["calls"] if "searchNearby" in u)

    # Simulate a new Lambda invocation: memory cache gone, DynamoDB cache warm
    places._mem_cache.clear()
    get_cards(code, member_b)
    nearby_calls_second = sum(1 for u in counters["calls"] if "searchNearby" in u)

    assert nearby_calls_first == 1
    assert nearby_calls_second == 1  # served from DynamoDB cache


def test_dislike_filter_uses_full_type_set_not_truncated_labels(located_room, monkeypatch):
    code, member_a, member_b = located_room
    install_google_stub(monkeypatch)

    # Both like thai and both dislike ramen (dislikes require unanimity —
    # see _choose_cuisines). "Noodle Empire" is typed
    # thai+vietnamese+korean+ramen (4 types) — extract_card's display
    # "cuisines" only keeps the first 3, dropping ramen_restaurant, so a
    # label-based filter would let it through. Type-based filtering must not.
    save_prefs(code, member_a, ["thai"], disliked=["ramen"])
    save_prefs(code, member_b, ["thai"], disliked=["ramen"])

    data = body_of(get_cards(code, member_a))
    ids = {c["place_id"] for c in data["cards"]}
    assert "p-thai-many-types" not in ids
    # Sanity: places without the disliked type still show up
    assert "p-thai-1" in ids


def test_free_places_pass_any_price_filter(located_room, monkeypatch):
    code, member_a, member_b = located_room
    install_google_stub(monkeypatch)

    # Cheapest tier only — a $0 (free) place should still be included,
    # since "budget" filters mean "at most this much", not "exactly this".
    save_prefs(code, member_a, ["thai"], prices=[1])
    save_prefs(code, member_b, ["thai"])

    data = body_of(get_cards(code, member_a))
    ids = {c["place_id"] for c in data["cards"]}
    assert "p-thai-free" in ids
    assert "p-thai-expensive" not in ids  # $$$$ correctly still filtered
