export type SwipeDirection = 'left' | 'right';

export interface SwipeResult {
  matched: boolean;
  match?: {
    place_id: string;
    name: string;
    photo_url: string | null;
  };
}
