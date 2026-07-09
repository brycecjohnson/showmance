import { get, post, put } from './client';
import { mock, MOCK_ENABLED } from './mock';
import type { Room, RoomLocation, Preferences } from '../types/room';

interface CreateRoomResponse {
  room_code: string;
  partner_id: string;
}

interface JoinRoomResponse {
  partner_id: string;
}

export interface SetLocationParams {
  lat?: number;
  lng?: number;
  /** Display label to keep when resending unchanged lat/lng (e.g. a
   *  radius-only edit) — without it the backend defaults to "Current
   *  location", clobbering a geocoded address label. Ignored when `address`
   *  is set, since the backend derives a fresh label from geocoding. */
  label?: string;
  address?: string;
  radius_m: number;
}

interface SetLocationResponse {
  location: RoomLocation;
  radius_m: number;
}

export function createRoom(solo?: boolean): Promise<CreateRoomResponse> {
  if (MOCK_ENABLED) return mock.createRoom(solo);
  return post<CreateRoomResponse>('/rooms', solo ? { solo: true } : undefined);
}

export function joinRoom(code: string): Promise<JoinRoomResponse> {
  if (MOCK_ENABLED) return mock.joinRoom(code);
  return post<JoinRoomResponse>(`/rooms/${code}/join`);
}

export function getRoom(code: string): Promise<Room> {
  if (MOCK_ENABLED) return mock.getRoom(code);
  return get<Room>(`/rooms/${code}`);
}

export function setRoomLocation(
  code: string,
  params: SetLocationParams,
): Promise<SetLocationResponse> {
  if (MOCK_ENABLED) return mock.setRoomLocation(code, params);
  return put<SetLocationResponse>(`/rooms/${code}/location`, params);
}

export function savePreferences(
  code: string,
  preferences: Partial<Omit<Preferences, 'partner_id'>>,
): Promise<void> {
  if (MOCK_ENABLED) return mock.savePreferences(preferences);
  return post(`/rooms/${code}/preferences`, preferences);
}
