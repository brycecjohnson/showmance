export interface RoomLocation {
  lat: number;
  lng: number;
  label: string;
}

export interface Room {
  room_code: string;
  partner_number: number;
  other_partner_joined: boolean;
  created_at: string;
  onboarding_complete: boolean;
  is_solo: boolean;
  location: RoomLocation | null;
  radius_m: number;
  price_levels: number[];
}

export interface Preferences {
  partner_id: string;
  cuisines_liked: string[];
  cuisines_disliked: string[];
  price_levels: number[];
}
