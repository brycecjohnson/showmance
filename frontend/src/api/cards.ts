import { get } from './client';
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
  return get<GetCardsResponse>(`/cards/${code}?mode=${mode}`);
}
