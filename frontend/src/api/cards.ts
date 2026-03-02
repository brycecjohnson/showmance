import { get } from './client';
import { mock, MOCK_ENABLED } from './mock';
import type { Card } from '../types/card';
import type { MediaMode } from '../types/room';

interface GetCardsResponse {
  cards: Card[];
  has_more: boolean;
}

export function getCards(
  code: string,
  mode: MediaMode,
): Promise<GetCardsResponse> {
  if (MOCK_ENABLED) return mock.getCards(code, mode);
  return get<GetCardsResponse>(`/cards/${code}?mode=${mode}`);
}
