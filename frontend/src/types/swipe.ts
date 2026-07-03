export type SwipeDirection = 'left' | 'right';

export interface SwipeRecord {
  place_id: string;
  partner_id: string;
  direction: SwipeDirection;
  swiped_at: string;
  name: string;
}

export interface SwipeResult {
  matched: boolean;
  match?: {
    place_id: string;
    name: string;
    photo_url: string | null;
  };
}
