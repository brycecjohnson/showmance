import { get, post } from './client';
import { mock, MOCK_ENABLED } from './mock';
import type { Room, Preferences } from '../types/room';

interface CreateRoomResponse {
  room_code: string;
  partner_id: string;
}

interface JoinRoomResponse {
  partner_id: string;
}

export function createRoom(): Promise<CreateRoomResponse> {
  if (MOCK_ENABLED) return mock.createRoom();
  return post<CreateRoomResponse>('/rooms');
}

export function joinRoom(code: string): Promise<JoinRoomResponse> {
  if (MOCK_ENABLED) return mock.joinRoom(code);
  return post<JoinRoomResponse>(`/rooms/${code}/join`);
}

export function getRoom(code: string): Promise<Room> {
  if (MOCK_ENABLED) return mock.getRoom(code);
  return get<Room>(`/rooms/${code}`);
}

export function savePreferences(
  code: string,
  preferences: Omit<Preferences, 'partner_id'>,
): Promise<void> {
  if (MOCK_ENABLED) return mock.savePreferences();
  return post(`/rooms/${code}/preferences`, preferences);
}
