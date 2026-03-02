import { get, patch } from './client';
import { mock, MOCK_ENABLED } from './mock';
import type { Match } from '../types/match';
import type { MediaMode } from '../types/room';

interface GetMatchesResponse {
  matches: Match[];
}

interface TonightsPickResponse {
  match: Match;
}

export function getMatches(
  code: string,
  mode: MediaMode,
): Promise<GetMatchesResponse> {
  if (MOCK_ENABLED) return mock.getMatches(code, mode);
  return get<GetMatchesResponse>(`/matches/${code}?mode=${mode}`);
}

export function updateMatch(
  code: string,
  tmdbId: number,
  updates: { watched?: boolean },
): Promise<void> {
  if (MOCK_ENABLED) return mock.updateMatch();
  return patch(`/matches/${code}/${tmdbId}`, updates);
}

export function getTonightsPick(
  code: string,
  mode: MediaMode,
): Promise<TonightsPickResponse> {
  if (MOCK_ENABLED) return mock.getTonightsPick(code, mode);
  return get<TonightsPickResponse>(`/tonight/${code}?mode=${mode}`);
}
