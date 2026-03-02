import { post } from './client';
import type { SwipeDirection, SwipeResult } from '../types/swipe';
import type { MediaMode } from '../types/room';

interface RecordSwipePayload {
  room_code: string;
  partner_id: string;
  tmdb_id: number;
  direction: SwipeDirection;
  media_type: MediaMode;
  title: string;
}

export function recordSwipe(
  payload: RecordSwipePayload,
): Promise<SwipeResult> {
  return post<SwipeResult>('/swipe', payload);
}
