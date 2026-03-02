import { STORAGE_KEYS } from './constants';
import type { MediaMode } from '../types/room';

export function getRoomCode(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ROOM_CODE);
}

export function setRoomCode(code: string): void {
  localStorage.setItem(STORAGE_KEYS.ROOM_CODE, code);
}

export function getPartnerId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.PARTNER_ID);
}

export function setPartnerId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.PARTNER_ID, id);
}

export function getMode(): MediaMode {
  return (localStorage.getItem(STORAGE_KEYS.MODE) as MediaMode) || 'movie';
}

export function setMode(mode: MediaMode): void {
  localStorage.setItem(STORAGE_KEYS.MODE, mode);
}

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
}

export function setOnboardingComplete(complete: boolean): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, String(complete));
}

export function getLastSeenMatches(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_SEEN_MATCHES);
}

export function setLastSeenMatches(timestamp: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_SEEN_MATCHES, timestamp);
}

export function clearSession(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
