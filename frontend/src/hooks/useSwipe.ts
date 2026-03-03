import { useCallback, useState } from 'react';
import { recordSwipe } from '../api/swipes';
import { useRoomContext } from '../context/RoomContext';
import { useModeContext } from '../context/ModeContext';
import type { SwipeDirection, SwipeResult } from '../types/swipe';
import type { Card } from '../types/card';

export function useSwipe() {
  const { roomCode, partnerId } = useRoomContext();
  const { mode } = useModeContext();
  const [lastResult, setLastResult] = useState<SwipeResult | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const swipe = useCallback(
    async (card: Card, direction: SwipeDirection): Promise<SwipeResult> => {
      if (!roomCode || !partnerId) {
        throw new Error('Not in a room');
      }
      setIsSwiping(true);
      try {
        const result = await recordSwipe({
          room_code: roomCode,
          partner_id: partnerId,
          tmdb_id: card.tmdb_id,
          direction,
          media_type: mode,
          title: card.title,
          poster_path: card.poster_path ?? undefined,
          year: card.release_year ? String(card.release_year) : undefined,
        });
        setLastResult(result);
        return result;
      } finally {
        setIsSwiping(false);
      }
    },
    [roomCode, partnerId, mode],
  );

  const clearResult = useCallback(() => setLastResult(null), []);

  return { swipe, lastResult, clearResult, isSwiping };
}
