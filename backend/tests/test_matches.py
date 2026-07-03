"""Match list, visited flow, tonight's pick, snapshot refresh."""

import json
from datetime import datetime, timedelta, timezone

import shared.places as places
from conftest import load_handler, make_event, body_of
from test_swipes import swipe


def make_match(code, member_a, member_b, place_id="place-1"):
    swipe(code, member_a, place_id, "right")
    swipe(code, member_b, place_id, "right")


def test_get_matches_shape_and_distance(located_room):
    code, member_a, member_b = located_room
    make_match(code, member_a, member_b)

    handler = load_handler("get_matches")
    data = body_of(handler(make_event(path_params={"code": code}, member_id=member_a), None))

    assert data["count"] == 1
    match = data["matches"][0]
    assert match["place_id"] == "place-1"
    assert match["name"] == "Terra Rossa"
    assert match["rating"] == 4.6  # float again, not the stored string
    assert match["price_level"] == 3
    assert match["visited"] is False
    # Snapshot coords vs room location (downtown Austin) — ~0.1 mi
    assert match["distance_mi"] is not None
    assert match["distance_mi"] < 1


def test_update_match_visited_roundtrip(located_room):
    code, member_a, member_b = located_room
    make_match(code, member_a, member_b)

    update = load_handler("update_match")
    resp = update(
        make_event(body={"visited": True},
                   path_params={"code": code, "place_id": "place-1"},
                   member_id=member_a),
        None,
    )
    assert resp["statusCode"] == 200
    assert body_of(resp)["visited"] is True

    get_matches = load_handler("get_matches")
    data = body_of(get_matches(make_event(path_params={"code": code}, member_id=member_a), None))
    assert data["matches"][0]["visited"] is True
    assert data["matches"][0]["visited_at"]

    resp = update(
        make_event(body={"visited": False},
                   path_params={"code": code, "place_id": "place-1"},
                   member_id=member_a),
        None,
    )
    assert body_of(resp)["visited"] is False


def test_tonights_pick_skips_visited(located_room):
    code, member_a, member_b = located_room
    make_match(code, member_a, member_b, "place-1")
    make_match(code, member_a, member_b, "place-2")

    update = load_handler("update_match")
    update(make_event(body={"visited": True},
                      path_params={"code": code, "place_id": "place-1"},
                      member_id=member_a), None)

    pick_handler = load_handler("tonights_pick")
    data = body_of(pick_handler(make_event(path_params={"code": code}, member_id=member_a), None))
    assert data["match"]["place_id"] == "place-2"

    update(make_event(body={"visited": True},
                      path_params={"code": code, "place_id": "place-2"},
                      member_id=member_a), None)
    resp = pick_handler(make_event(path_params={"code": code}, member_id=member_a), None)
    assert resp["statusCode"] == 404


def test_stale_snapshot_refreshes_from_details(located_room, table, monkeypatch):
    code, member_a, member_b = located_room
    make_match(code, member_a, member_b)

    # Age the snapshot past the 30-day ToS cap
    old = (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()
    table.update_item(
        Key={"PK": f"ROOM#{code}", "SK": "MATCH#restaurant#place-1"},
        UpdateExpression="SET snapshot_at = :old",
        ExpressionAttributeValues={":old": old},
    )

    def fake_http(url, method="GET", body=None, headers=None):
        # /media check must come first — photo URLs also contain /places/{id}
        if "/media" in url:
            return {"photoUri": "https://lh3.googleusercontent.com/fresh"}
        if "/places/place-1" in url:
            return {
                "id": "place-1",
                "displayName": {"text": "Terra Rossa (Renamed)"},
                "types": ["italian_restaurant"],
                "location": {"latitude": 30.2663, "longitude": -97.7431},
                "rating": 4.8,
                "userRatingCount": 900,
                "priceLevel": "PRICE_LEVEL_EXPENSIVE",
                "shortFormattedAddress": "412 Congress Ave, Austin",
                "photos": [{"name": "places/place-1/photos/xyz"}],
                "googleMapsUri": "https://maps.google.com/?cid=1",
            }
        return None

    monkeypatch.setattr(places, "_http_json", fake_http)

    handler = load_handler("get_matches")
    data = body_of(handler(make_event(path_params={"code": code}, member_id=member_a), None))

    match = data["matches"][0]
    assert match["name"] == "Terra Rossa (Renamed)"
    assert match["rating"] == 4.8
    assert match["photo_url"] == "https://lh3.googleusercontent.com/fresh"

    # Persisted, not just in the response
    item = table.get_item(Key={"PK": f"ROOM#{code}", "SK": "MATCH#restaurant#place-1"})["Item"]
    assert item["name"] == "Terra Rossa (Renamed)"
    assert item["snapshot_at"] > old


def test_fresh_snapshot_not_refreshed(located_room, monkeypatch):
    code, member_a, member_b = located_room
    make_match(code, member_a, member_b)

    def fail_http(url, **kwargs):
        raise AssertionError(f"Should not call Google for fresh snapshots: {url}")

    monkeypatch.setattr(places, "_http_json", fail_http)

    handler = load_handler("get_matches")
    resp = handler(make_event(path_params={"code": code}, member_id=member_a), None)
    assert resp["statusCode"] == 200
