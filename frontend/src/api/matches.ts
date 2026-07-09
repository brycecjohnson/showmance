import { get, patch } from './client';
import { mock, MOCK_ENABLED } from './mock';
import type { Match } from '../types/match';

interface GetMatchesResponse {
  matches: Match[];
}

interface TonightsPickResponse {
  match: Match;
}

export function getMatches(code: string): Promise<GetMatchesResponse> {
  if (MOCK_ENABLED) return mock.getMatches(code);
  return get<GetMatchesResponse>(`/matches/${code}`);
}

export function updateMatch(
  code: string,
  placeId: string,
  updates: { visited?: boolean },
): Promise<void> {
  if (MOCK_ENABLED) return mock.updateMatch(code, placeId, updates);
  return patch(`/matches/${code}/${placeId}`, updates);
}

export function getTonightsPick(code: string): Promise<TonightsPickResponse> {
  if (MOCK_ENABLED) return mock.getTonightsPick(code);
  return get<TonightsPickResponse>(`/tonight/${code}`);
}
