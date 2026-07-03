import { get } from './client';
import { mock, MOCK_ENABLED } from './mock';
import type { RestaurantCard } from '../types/card';

interface GetCardsResponse {
  cards: RestaurantCard[];
  has_more: boolean;
}

export function getCards(code: string): Promise<GetCardsResponse> {
  if (MOCK_ENABLED) return mock.getCards(code);
  return get<GetCardsResponse>(`/cards/${code}`);
}
