import { get, post } from './client';
import type { Room, Preferences } from '../types/room';

interface CreateRoomResponse {
  room_code: string;
  partner_id: string;
}

interface JoinRoomResponse {
  partner_id: string;
}

export function createRoom(): Promise<CreateRoomResponse> {
  return post<CreateRoomResponse>('/rooms');
}

export function joinRoom(code: string): Promise<JoinRoomResponse> {
  return post<JoinRoomResponse>(`/rooms/${code}/join`);
}

export function getRoom(code: string): Promise<Room> {
  return get<Room>(`/rooms/${code}`);
}

export function savePreferences(
  code: string,
  preferences: Omit<Preferences, 'partner_id'>,
): Promise<void> {
  return post(`/rooms/${code}/preferences`, preferences);
}
