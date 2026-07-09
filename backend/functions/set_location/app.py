"""PUT /rooms/{code}/location — Set the room's search location and radius.

Body: { "lat": number, "lng": number, "radius_m": number }
   or { "address": string, "radius_m": number }  (geocoded server-side)

Either member can update it; the deck derives from the room's current location.
"""

from shared.dynamo import get_item, update_item
from shared.response import success, error, not_found, server_error
from shared.validation import (
    get_path_param, get_partner_id, parse_body,
    is_valid_room_code, is_valid_lat_lng, is_valid_radius, is_member,
)
from shared import places


def handler(event, context):
    code = get_path_param(event, "code")
    if not code or not is_valid_room_code(code):
        return error("Invalid room code. Expected format: EATS-XXXX")

    member_id = get_partner_id(event)
    if not member_id:
        return error("Missing X-Partner-Id header")

    body = parse_body(event)
    if not body:
        return error("Request body is required")

    radius_m = body.get("radius_m")
    if not is_valid_radius(radius_m):
        return error("radius_m must be between 500 and 50000 meters")
    radius_m = int(radius_m)

    address = body.get("address")
    lat = body.get("lat")
    lng = body.get("lng")

    if not address and not (lat is not None and lng is not None):
        return error("Provide either lat/lng or an address")

    try:
        room = get_item(f"ROOM#{code}", "METADATA")
        if not room:
            return not_found(f"Room {code} not found")

        if not is_member(room, member_id):
            return error("You are not a member of this room", status_code=403)

        if address:
            if not isinstance(address, str) or not (2 <= len(address.strip()) <= 300):
                return error("address must be a string of 2-300 characters")
            geocoded = places.geocode(address.strip())
            if not geocoded:
                return error("Could not find that address", status_code=422)
            location = geocoded
        else:
            if not is_valid_lat_lng(lat, lng):
                return error("lat/lng out of bounds")
            # Client passes the existing label through on a radius-only edit
            # (unchanged coordinates) so it isn't clobbered back to the GPS
            # default — e.g. a geocoded address name would otherwise be lost.
            label = body.get("label")
            if not isinstance(label, str) or not (1 <= len(label.strip()) <= 300):
                label = "Current location"
            location = {
                "lat": float(lat),
                "lng": float(lng),
                "label": label.strip(),
            }

        # DynamoDB rejects float types — store coordinates as strings and
        # convert on read (get_room / get_cards).
        stored = {
            "lat": str(location["lat"]),
            "lng": str(location["lng"]),
            "label": location["label"],
        }

        update_item(
            pk=f"ROOM#{code}",
            sk="METADATA",
            update_expr="SET #loc = :loc, radius_m = :radius",
            expr_values={":loc": stored, ":radius": radius_m},
            expr_names={"#loc": "location"},
        )

        return success({
            "location": location,
            "radius_m": radius_m,
        })

    except Exception as e:
        print(f"Error setting location: {e}")
        return server_error("Failed to set location")
