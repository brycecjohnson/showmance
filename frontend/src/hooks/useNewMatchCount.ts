import { useEffect, useState } from 'react';
import { getMatches } from '../api/matches';
import { useRoomContext } from '../context/RoomContext';
import { getLastSeenMatches } from '../utils/storage';

/** Unvisited matches made since the user last opened the Places tab. */
export function useNewMatchCount() {
  const { roomCode } = useRoomContext();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;

    getMatches(roomCode)
      .then((data) => {
        if (cancelled) return;
        const lastSeen = getLastSeenMatches();
        const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
        const count = data.matches.filter(
          (m) => !m.visited && new Date(m.matched_at).getTime() > lastSeenTime,
        ).length;
        setNewCount(count);
      })
      .catch(() => {
        // Badge is a nice-to-have; fail silently rather than surfacing an
        // error toast for a background count fetch on every navigation.
      });

    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  return newCount;
}
