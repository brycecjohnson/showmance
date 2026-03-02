import type { MediaMode } from './room';

export type SwipeDirection = 'left' | 'right';

export interface SwipeRecord {
  tmdb_id: number;
  partner_id: string;
  direction: SwipeDirection;
  swiped_at: string;
  title: string;
  media_type: MediaMode;
}

export interface SwipeResult {
  matched: boolean;
  match?: {
    tmdb_id: number;
    title: string;
    poster_path: string | null;
    media_type: MediaMode;
  };
}
