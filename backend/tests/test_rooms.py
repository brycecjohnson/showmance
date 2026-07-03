"""Room lifecycle: create, join, capacity, membership, get_room shape."""

from conftest import load_handler, make_event, body_of


def test_create_room_returns_eats_code_and_member(table):
    handler = load_handler("create_room")
    resp = handler(make_event(body={}), None)
    assert resp["statusCode"] == 201

    data = body_of(resp)
    assert data["room_code"].startswith("EATS-")
    assert len(data["room_code"]) == 9
    assert data["partner_id"]

    item = table.get_item(Key={"PK": f"ROOM#{data['room_code']}", "SK": "METADATA"})["Item"]
    assert item["member_count"] == 1
    assert item["max_members"] == 2
    assert data["partner_id"] in item["members"]
    assert item["location"] is None


def test_join_room_fills_and_rejects_third(room):
    code, _a, _b = room
    join = load_handler("join_room")

    resp = join(make_event(path_params={"code": code}), None)
    assert resp["statusCode"] == 409


def test_solo_room_rejects_join(table):
    create = load_handler("create_room")
    join = load_handler("join_room")

    code = body_of(create(make_event(body={"solo": True}), None))["room_code"]
    resp = join(make_event(path_params={"code": code}), None)
    assert resp["statusCode"] == 409


def test_join_missing_room_404(table):
    join = load_handler("join_room")
    resp = join(make_event(path_params={"code": "EATS-ZZZZ"}), None)
    assert resp["statusCode"] == 404


def test_get_room_membership_and_shape(room):
    code, member_a, member_b = room
    get_room = load_handler("get_room")

    resp = get_room(make_event(path_params={"code": code}, member_id=member_a), None)
    assert resp["statusCode"] == 200
    data = body_of(resp)
    assert data["partner_number"] == 1
    assert data["other_partner_joined"] is True
    assert data["location"] is None
    assert data["radius_m"] == 8047
    assert data["price_levels"] == []

    data_b = body_of(get_room(make_event(path_params={"code": code}, member_id=member_b), None))
    assert data_b["partner_number"] == 2

    # Non-member is rejected
    resp = get_room(make_event(path_params={"code": code}, member_id="intruder"), None)
    assert resp["statusCode"] == 403


def test_invalid_room_code_format(table):
    get_room = load_handler("get_room")
    resp = get_room(make_event(path_params={"code": "SHOW-AAAA"}, member_id="x"), None)
    assert resp["statusCode"] == 400
