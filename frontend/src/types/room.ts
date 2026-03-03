export type MediaMode = 'movie' | 'tv';

export interface Room {
  room_code: string;
  partner_number: number;
  other_partner_joined: boolean;
  created_at: string;
  streaming_services: string[];
  onboarding_complete: boolean;
  is_solo: boolean;
}

export interface Preferences {
  partner_id: string;
  genres_liked: string[];
  genres_disliked: string[];
  eras: string[];
  streaming_services: string[];
  seed_liked?: number[];
}

export interface RoomState {
  roomCode: string | null;
  partnerId: string | null;
  room: Room | null;
  isLoading: boolean;
  error: string | null;
}
