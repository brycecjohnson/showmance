import { post } from './client';
import { mock, MOCK_ENABLED } from './mock';
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
  if (MOCK_ENABLED) return mock.recordSwipe(payload) as Promise<SwipeResult>;
  return post<SwipeResult>('/swipe', payload);
}
