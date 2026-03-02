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

interface RoomContextValue {
  roomCode: string | null;
  partnerId: string | null;
  room: Room | null;
  isLoading: boolean;
  error: string | null;
  createRoom: () => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  loadRoom: () => Promise<void>;
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

  const loadRoom = useCallback(async () => {
    const code = storage.getRoomCode();
    if (!code) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await roomsApi.getRoom(code);
      setRoom(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoom = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await roomsApi.createRoom();
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
        isLoading,
        error,
        createRoom,
        joinRoom,
        loadRoom,
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
