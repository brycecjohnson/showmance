export type MediaMode = 'movie' | 'tv';

export interface Room {
  room_code: string;
  created_at: string;
  partner_1_id: string;
  partner_2_id: string | null;
  streaming_services: string[];
  onboarding_complete: boolean;
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
