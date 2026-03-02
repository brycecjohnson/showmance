import { useCallback, useState } from 'react';
import { getMatches, updateMatch, getTonightsPick } from '../api/matches';
import { useRoomContext } from '../context/RoomContext';
import { useModeContext } from '../context/ModeContext';
import type { Match } from '../types/match';

export function useMatches() {
  const { roomCode } = useRoomContext();
  const { mode } = useModeContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!roomCode) return;
    setIsLoading(true);
    try {
      const data = await getMatches(roomCode, mode);
      setMatches(data.matches);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, mode]);

  const markWatched = useCallback(
    async (tmdbId: number) => {
      if (!roomCode) return;
      await updateMatch(roomCode, tmdbId, { watched: true });
      setMatches((prev) =>
        prev.map((m) =>
          m.tmdb_id === tmdbId
            ? { ...m, watched: true, watched_at: new Date().toISOString() }
            : m,
        ),
      );
    },
    [roomCode],
  );

  const pickTonight = useCallback(async (): Promise<Match | null> => {
    if (!roomCode) return null;
    const data = await getTonightsPick(roomCode, mode);
    return data.match;
  }, [roomCode, mode]);

  return { matches, isLoading, fetchMatches, markWatched, pickTonight };
}
