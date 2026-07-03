import { post } from './client';
import { mock, MOCK_ENABLED } from './mock';
import type { SwipeDirection, SwipeResult } from '../types/swipe';

interface RecordSwipePayload {
  room_code: string;
  partner_id: string;
  place_id: string;
  direction: SwipeDirection;
  name: string;
  photo_url?: string;
}

export function recordSwipe(
  payload: RecordSwipePayload,
): Promise<SwipeResult> {
  if (MOCK_ENABLED) return mock.recordSwipe(payload) as Promise<SwipeResult>;
  return post<SwipeResult>('/swipe', payload);
}
