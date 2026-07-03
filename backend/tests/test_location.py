"""Location endpoint: GPS coords, server-side geocoding, validation."""

import shared.places as places
from conftest import load_handler, make_event, body_of


def test_set_location_with_coords(room):
    code, member_a, _b = room
    set_location = load_handler("set_location")
    get_room = load_handler("get_room")

    resp = set_location(
        make_event(
            body={"lat": 30.25, "lng": -97.75, "radius_m": 4828},
            path_params={"code": code},
            member_id=member_a,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    data = body_of(resp)
    assert data["location"] == {"lat": 30.25, "lng": -97.75, "label": "Current location"}
    assert data["radius_m"] == 4828

    # get_room returns floats, not stored strings
    room_data = body_of(get_room(make_event(path_params={"code": code}, member_id=member_a), None))
    assert room_data["location"]["lat"] == 30.25
    assert isinstance(room_data["location"]["lat"], float)
    assert room_data["radius_m"] == 4828


def test_set_location_with_address_geocodes(room, monkeypatch):
    code, member_a, _b = room
    set_location = load_handler("set_location")

    def fake_http(url, **kwargs):
        assert "maps.googleapis.com" in url
        return {
            "status": "OK",
            "results": [{
                "geometry": {"location": {"lat": 30.24, "lng": -97.755}},
                "formatted_address": "S Congress Ave, Austin, TX, USA",
            }],
        }

    monkeypatch.setattr(places, "_http_json", fake_http)

    resp = set_location(
        make_event(
            body={"address": "south congress austin", "radius_m": 8047},
            path_params={"code": code},
            member_id=member_a,
        ),
        None,
    )
    assert resp["statusCode"] == 200
    data = body_of(resp)
    assert data["location"]["label"] == "S Congress Ave, Austin, TX, USA"
    assert data["location"]["lat"] == 30.24


def test_geocode_results_are_cached(room, monkeypatch):
    code, member_a, _b = room
    set_location = load_handler("set_location")

    calls = {"n": 0}

    def fake_http(url, **kwargs):
        calls["n"] += 1
        return {
            "status": "OK",
            "results": [{
                "geometry": {"location": {"lat": 1.0, "lng": 2.0}},
                "formatted_address": "Somewhere",
            }],
        }

    monkeypatch.setattr(places, "_http_json", fake_http)

    event = make_event(
        body={"address": "somewhere", "radius_m": 8047},
        path_params={"code": code},
        member_id=member_a,
    )
    set_location(event, None)
    set_location(event, None)
    assert calls["n"] == 1  # second call served from cache


def test_geocode_failure_returns_422(room, monkeypatch):
    code, member_a, _b = room
    set_location = load_handler("set_location")
    monkeypatch.setattr(places, "_http_json", lambda url, **k: {"status": "ZERO_RESULTS"})

    resp = set_location(
        make_event(
            body={"address": "xyzzy nowhere", "radius_m": 8047},
            path_params={"code": code},
            member_id=member_a,
        ),
        None,
    )
    assert resp["statusCode"] == 422


def test_set_location_validation(room):
    code, member_a, _b = room
    set_location = load_handler("set_location")

    # Bad radius
    resp = set_location(
        make_event(body={"lat": 1, "lng": 2, "radius_m": 10},
                   path_params={"code": code}, member_id=member_a),
        None,
    )
    assert resp["statusCode"] == 400

    # Neither coords nor address
    resp = set_location(
        make_event(body={"radius_m": 8047},
                   path_params={"code": code}, member_id=member_a),
        None,
    )
    assert resp["statusCode"] == 400

    # Out-of-bounds coords
    resp = set_location(
        make_event(body={"lat": 91, "lng": 0, "radius_m": 8047},
                   path_params={"code": code}, member_id=member_a),
        None,
    )
    assert resp["statusCode"] == 400

    # Non-member
    resp = set_location(
        make_event(body={"lat": 1, "lng": 2, "radius_m": 8047},
                   path_params={"code": code}, member_id="intruder"),
        None,
    )
    assert resp["statusCode"] == 403
