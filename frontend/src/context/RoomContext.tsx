import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Room } from '../types/room';
import * as storage from '../utils/storage';
import * as roomsApi from '../api/rooms';
import { ApiError } from '../api/client';

interface RoomContextValue {
  roomCode: string | null;
  partnerId: string | null;
  room: Room | null;
  isSolo: boolean;
  isLoading: boolean;
  error: string | null;
  /** Set when a dead room (404/403) forced the user back to the landing page. */
  sessionEnded: boolean;
  clearSessionEnded: () => void;
  createRoom: (solo?: boolean) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  loadRoom: () => Promise<void>;
  updateLocation: (params: roomsApi.SetLocationParams) => Promise<void>;
  leaveRoom: () => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [roomCode, setRoomCode] = useState<string | null>(
    storage.getRoomCode,
  );
  const [partnerId, setPartnerId] = useState<string | null>(
    storage.getPartnerId,
  );
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const clearSessionEnded = useCallback(() => setSessionEnded(false), []);

  const loadRoom = useCallback(async () => {
    const code = storage.getRoomCode();
    if (!code) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await roomsApi.getRoom(code);
      setRoom(data);
    } catch (err) {
      // Room deleted server-side, or this device's saved membership is stale
      // (403). There's no recovering in place — clear the dead session so
      // ProtectedRoute bounces to the landing page instead of getting stuck.
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
        storage.clearSession();
        setRoomCode(null);
        setPartnerId(null);
        setRoom(null);
        setSessionEnded(true);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoom = useCallback(async (solo?: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await roomsApi.createRoom(solo);
      storage.setRoomCode(data.room_code);
      storage.setPartnerId(data.partner_id);
      setRoomCode(data.room_code);
      setPartnerId(data.partner_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await roomsApi.joinRoom(code);
      storage.setRoomCode(code);
      storage.setPartnerId(data.partner_id);
      setRoomCode(code);
      setPartnerId(data.partner_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLocation = useCallback(async (params: roomsApi.SetLocationParams) => {
    const code = storage.getRoomCode();
    if (!code) throw new Error('Not in a room');
    const data = await roomsApi.setRoomLocation(code, params);
    setRoom((prev) =>
      prev
        ? { ...prev, location: data.location, radius_m: data.radius_m }
        : prev,
    );
  }, []);

  const leaveRoom = useCallback(() => {
    storage.clearSession();
    setRoomCode(null);
    setPartnerId(null);
    setRoom(null);
  }, []);

  useEffect(() => {
    if (roomCode) {
      loadRoom();
    }
  }, [roomCode, loadRoom]);

  return (
    <RoomContext.Provider
      value={{
        roomCode,
        partnerId,
        room,
        isSolo: room?.is_solo ?? false,
        isLoading,
        error,
        sessionEnded,
        clearSessionEnded,
        createRoom,
        joinRoom,
        loadRoom,
        updateLocation,
        leaveRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoomContext must be used within RoomProvider');
  return ctx;
}
