import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { RoomProvider, useRoomContext } from '../context/RoomContext';
import { ApiError } from '../api/client';

vi.mock('../api/rooms', () => ({
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  getRoom: vi.fn(),
}));

const storageState: Record<string, string> = {};

vi.mock('../utils/storage', () => ({
  getRoomCode: () => storageState.roomCode ?? null,
  getPartnerId: () => storageState.partnerId ?? null,
  setRoomCode: (v: string) => { storageState.roomCode = v; },
  setPartnerId: (v: string) => { storageState.partnerId = v; },
  clearSession: () => { delete storageState.roomCode; delete storageState.partnerId; },
  setOnboardingComplete: vi.fn(),
}));

import { getRoom } from '../api/rooms';
const mockGetRoom = vi.mocked(getRoom);

function wrapper({ children }: { children: ReactNode }) {
  return createElement(RoomProvider, null, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  storageState.roomCode = 'EATS-TEST';
  storageState.partnerId = 'partner-1';
});

describe('RoomContext fatal room errors', () => {
  it('clears the session and nulls the room on a 404 (room deleted)', async () => {
    mockGetRoom.mockRejectedValue(new ApiError(404, 'Room not found'));

    const { result } = renderHook(() => useRoomContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.roomCode).toBeNull();
    });

    expect(result.current.room).toBeNull();
    expect(result.current.partnerId).toBeNull();
    expect(result.current.sessionEnded).toBe(true);
    expect(storageState.roomCode).toBeUndefined();
  });

  it('clears the session on a 403 (stale membership)', async () => {
    mockGetRoom.mockRejectedValue(new ApiError(403, 'Not a member'));

    const { result } = renderHook(() => useRoomContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.roomCode).toBeNull();
    });
    expect(result.current.sessionEnded).toBe(true);
  });

  it('keeps the session and surfaces a transient error on a 500', async () => {
    mockGetRoom.mockRejectedValue(new ApiError(500, 'Internal error'));

    const { result } = renderHook(() => useRoomContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe('Internal error');
    });

    // Session survives — this is a retry-later case, not a dead room
    expect(result.current.roomCode).toBe('EATS-TEST');
    expect(result.current.sessionEnded).toBe(false);
  });

  it('clearSessionEnded resets the flag', async () => {
    mockGetRoom.mockRejectedValue(new ApiError(404, 'Room not found'));

    const { result } = renderHook(() => useRoomContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.sessionEnded).toBe(true);
    });

    act(() => {
      result.current.clearSessionEnded();
    });

    expect(result.current.sessionEnded).toBe(false);
  });

  it('loads normally on success', async () => {
    mockGetRoom.mockResolvedValue({
      room_code: 'EATS-TEST',
      partner_number: 1,
      other_partner_joined: false,
      created_at: new Date().toISOString(),
      onboarding_complete: false,
      is_solo: false,
      location: null,
      radius_m: 8047,
      price_levels: [],
    });

    const { result } = renderHook(() => useRoomContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.room).not.toBeNull();
    });
    expect(result.current.roomCode).toBe('EATS-TEST');
  });
});
