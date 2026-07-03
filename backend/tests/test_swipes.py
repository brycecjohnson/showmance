"""Swipe recording and group-ready match detection."""

from conftest import load_handler, make_event, body_of

CARD_SNAPSHOT = {
    "name": "Terra Rossa",
    "photo_url": "https://photos.example/terra.jpg",
    "rating": 4.6,
    "price_level": 3,
    "cuisines": ["Italian"],
    "address": "412 Congress Ave",
    "lat": 30.2663,
    "lng": -97.7431,
    "maps_url": "https://maps.google.com/?q=terra",
}


def swipe(code, member_id, place_id, direction, extra=None):
    handler = load_handler("record_swipe")
    body = {
        "room_code": code,
        "place_id": place_id,
        "direction": direction,
        **CARD_SNAPSHOT,
        **(extra or {}),
    }
    return handler(make_event(body=body, member_id=member_id), None)


def test_couple_match_requires_both_right(room, table):
    code, member_a, member_b = room

    resp = body_of(swipe(code, member_a, "place-1", "right"))
    assert resp["matched"] is False

    resp = body_of(swipe(code, member_b, "place-1", "right"))
    assert resp["matched"] is True
    assert resp["match"]["place_id"] == "place-1"
    assert resp["match"]["name"] == "Terra Rossa"

    match = table.get_item(Key={"PK": f"ROOM#{code}", "SK": "MATCH#restaurant#place-1"})["Item"]
    assert match["GSI1PK"] == f"ROOM#{code}#MATCHES#restaurant"
    assert match["visited"] is False
    assert match["snapshot_at"] == match["matched_at"]
    # Floats are stringified for DynamoDB
    assert match["rating"] == "4.6"
    assert match["cuisines"] == ["Italian"]


def test_left_swipes_never_match(room, table):
    code, member_a, member_b = room

    swipe(code, member_a, "place-2", "right")
    resp = body_of(swipe(code, member_b, "place-2", "left"))
    assert resp["matched"] is False

    item = table.get_item(Key={"PK": f"ROOM#{code}", "SK": "MATCH#restaurant#place-2"})
    assert "Item" not in item


def test_solo_right_swipe_auto_matches(table):
    create = load_handler("create_room")
    data = body_of(create(make_event(body={"solo": True}), None))
    code, member = data["room_code"], data["partner_id"]

    resp = body_of(swipe(code, member, "place-3", "right"))
    assert resp["matched"] is True


def test_swiped_set_accumulates(room, table):
    code, member_a, _b = room

    swipe(code, member_a, "place-4", "left")
    swipe(code, member_a, "place-5", "right")

    item = table.get_item(Key={"PK": f"ROOM#{code}", "SK": f"SWIPED#restaurant#{member_a}"})["Item"]
    assert item["swiped_ids"] == {"place-4", "place-5"}


def test_swipe_validation(room):
    code, member_a, _b = room
    handler = load_handler("record_swipe")

    resp = handler(make_event(body={"room_code": code, "place_id": "p", "direction": "up"},
                              member_id=member_a), None)
    assert resp["statusCode"] == 400

    resp = handler(make_event(body={"room_code": code, "direction": "right"},
                              member_id=member_a), None)
    assert resp["statusCode"] == 400

    resp = swipe(code, "intruder", "place-6", "right")
    assert resp["statusCode"] == 403
