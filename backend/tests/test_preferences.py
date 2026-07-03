"""Preferences: cuisine validation, price levels on the room, partial updates."""

from conftest import load_handler, make_event, body_of


def test_save_full_preferences(room, table):
    code, member_a, _b = room
    handler = load_handler("save_preferences")

    resp = handler(
        make_event(
            body={
                "cuisines_liked": ["thai", "sushi"],
                "cuisines_disliked": ["dessert"],
                "price_levels": [1, 2],
            },
            path_params={"code": code},
            member_id=member_a,
        ),
        None,
    )
    assert resp["statusCode"] == 200

    prefs = table.get_item(Key={"PK": f"ROOM#{code}", "SK": f"PREFS#{member_a}"})["Item"]
    assert prefs["cuisines_liked"] == ["thai", "sushi"]
    assert prefs["cuisines_disliked"] == ["dessert"]

    meta = table.get_item(Key={"PK": f"ROOM#{code}", "SK": "METADATA"})["Item"]
    assert [int(p) for p in meta["price_levels"]] == [1, 2]


def test_partial_price_update_preserves_cuisines(room, table):
    code, member_a, _b = room
    handler = load_handler("save_preferences")

    handler(
        make_event(
            body={"cuisines_liked": ["thai"], "cuisines_disliked": [], "price_levels": [2]},
            path_params={"code": code},
            member_id=member_a,
        ),
        None,
    )
    # Settings sends only price_levels
    handler(
        make_event(
            body={"price_levels": [3, 4]},
            path_params={"code": code},
            member_id=member_a,
        ),
        None,
    )

    prefs = table.get_item(Key={"PK": f"ROOM#{code}", "SK": f"PREFS#{member_a}"})["Item"]
    assert prefs["cuisines_liked"] == ["thai"]  # untouched

    meta = table.get_item(Key={"PK": f"ROOM#{code}", "SK": "METADATA"})["Item"]
    assert [int(p) for p in meta["price_levels"]] == [3, 4]


def test_invalid_inputs_rejected(room):
    code, member_a, _b = room
    handler = load_handler("save_preferences")

    resp = handler(
        make_event(body={"cuisines_liked": ["klingon"]},
                   path_params={"code": code}, member_id=member_a),
        None,
    )
    assert resp["statusCode"] == 400

    resp = handler(
        make_event(body={"price_levels": [7]},
                   path_params={"code": code}, member_id=member_a),
        None,
    )
    assert resp["statusCode"] == 400

    resp = handler(
        make_event(body={}, path_params={"code": code}, member_id=member_a),
        None,
    )
    assert resp["statusCode"] == 400
