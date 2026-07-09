import { useCallback, useState } from 'react';
import { getMatches, updateMatch, getTonightsPick } from '../api/matches';
import { useRoomContext } from '../context/RoomContext';
import type { Match } from '../types/match';

export function useMatches() {
  const { roomCode } = useRoomContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!roomCode) return;
    setIsLoading(true);
    try {
      const data = await getMatches(roomCode);
      setMatches(data.matches);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode]);

  const markVisited = useCallback(
    async (placeId: string) => {
      if (!roomCode) return;
      await updateMatch(roomCode, placeId, { visited: true });
      setMatches((prev) =>
        prev.map((m) =>
          m.place_id === placeId
            ? { ...m, visited: true, visited_at: new Date().toISOString() }
            : m,
        ),
      );
    },
    [roomCode],
  );

  const pickTonight = useCallback(async (): Promise<Match | null> => {
    if (!roomCode) return null;
    const data = await getTonightsPick(roomCode);
    return data.match;
  }, [roomCode]);

  return { matches, isLoading, fetchMatches, markVisited, pickTonight };
}
