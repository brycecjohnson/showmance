"""Unit tests for the places module helpers (no table needed except caching)."""

import shared.places as places


def test_geohash_known_values():
    # Canonical vector from the geohash spec (Wikipedia)
    assert places.geohash_encode(57.64911, 10.40744, 11) == "u4pruydqqvj"
    # Downtown Austin
    assert places.geohash_encode(30.2672, -97.7431, 5) == "9v6kp"


def test_geohash_jitter_same_bucket():
    a = places.geohash_encode(30.2672, -97.7431, 5)
    b = places.geohash_encode(30.2680, -97.7440, 5)  # ~100m away
    assert a == b


def test_haversine_zero_and_symmetry():
    assert places.haversine_miles(30.0, -97.0, 30.0, -97.0) == 0
    d1 = places.haversine_miles(30.2672, -97.7431, 30.39, -97.7269)
    d2 = places.haversine_miles(30.39, -97.7269, 30.2672, -97.7431)
    assert abs(d1 - d2) < 1e-9


def test_extract_card_maps_fields():
    place = {
        "id": "p1",
        "displayName": {"text": "Kaiyo"},
        "types": ["sushi_restaurant", "japanese_restaurant", "restaurant"],
        "location": {"latitude": 30.2590, "longitude": -97.7387},
        "rating": 4.8,
        "userRatingCount": 645,
        "priceLevel": "PRICE_LEVEL_VERY_EXPENSIVE",
        "shortFormattedAddress": "98 Rainey St",
        "currentOpeningHours": {"openNow": False},
        "photos": [{"name": "places/p1/photos/a"}],
    }
    card = places.extract_card(place, 30.2672, -97.7431)
    assert card["place_id"] == "p1"
    assert card["name"] == "Kaiyo"
    assert card["cuisines"] == ["Sushi", "Japanese"]
    assert card["price_level"] == 4
    assert card["open_now"] is False
    assert card["_photo_name"] == "places/p1/photos/a"
    assert 0.4 < card["distance_mi"] < 0.9


def test_extract_card_handles_sparse_place():
    card = places.extract_card({"id": "p2", "displayName": {"text": "Mystery Diner"}}, 30, -97)
    assert card["rating"] == 0
    assert card["price_level"] is None
    assert card["distance_mi"] is None
    assert card["cuisines"] == ["Restaurant"]
    assert card["_photo_name"] is None


def test_extract_card_rejects_incomplete():
    assert places.extract_card({"id": "x"}, 30, -97) is None
    assert places.extract_card({"displayName": {"text": "No Id"}}, 30, -97) is None


def test_all_frontend_cuisines_have_type_mappings():
    from shared.validation import VALID_CUISINES
    assert set(places.CUISINE_PLACE_TYPES) == VALID_CUISINES


def test_parse_stored_location():
    assert places.parse_stored_location(None) is None
    assert places.parse_stored_location({"lat": "30.25", "lng": "-97.75", "label": "X"}) == {
        "lat": 30.25, "lng": -97.75, "label": "X",
    }
