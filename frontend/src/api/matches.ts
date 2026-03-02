import { get, patch } from './client';
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
  return get<GetMatchesResponse>(`/matches/${code}?mode=${mode}`);
}

export function updateMatch(
  code: string,
  tmdbId: number,
  updates: { watched?: boolean },
): Promise<void> {
  return patch(`/matches/${code}/${tmdbId}`, updates);
}

export function getTonightsPick(
  code: string,
  mode: MediaMode,
): Promise<TonightsPickResponse> {
  return get<TonightsPickResponse>(`/tonight/${code}?mode=${mode}`);
}
