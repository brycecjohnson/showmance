import { useCallback, useEffect, useRef, useState } from 'react';
import { getCards } from '../api/cards';
import { useRoomContext } from '../context/RoomContext';
import { useModeContext } from '../context/ModeContext';
import type { Card } from '../types/card';
import { CARDS_PREFETCH_THRESHOLD } from '../utils/constants';

export function useCards() {
  const { roomCode } = useRoomContext();
  const { mode } = useModeContext();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const prevModeRef = useRef(mode);

  // Reset deck when mode changes
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      setCards([]);
      setHasMore(true);
    }
  }, [mode]);

  const fetchCards = useCallback(async () => {
    if (!roomCode || isLoading) return;
    setIsLoading(true);
    try {
      const data = await getCards(roomCode, mode);
      setCards((prev) => {
        const existingIds = new Set(prev.map((c) => c.tmdb_id));
        const newCards = data.cards.filter((c) => !existingIds.has(c.tmdb_id));
        return [...prev, ...newCards];
      });
      setHasMore(data.has_more);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, mode, isLoading]);

  // Prefetch when card count drops below threshold
  useEffect(() => {
    if (cards.length > 0 && cards.length <= CARDS_PREFETCH_THRESHOLD && hasMore && !isLoading) {
      fetchCards();
    }
  }, [cards.length, hasMore, isLoading, fetchCards]);

  const removeTopCard = useCallback(() => {
    setCards((prev) => prev.slice(1));
  }, []);

  const resetCards = useCallback(() => {
    setCards([]);
    setHasMore(true);
  }, []);

  return {
    cards,
    currentCard: cards[0] ?? null,
    isLoading,
    hasMore,
    fetchCards,
    removeTopCard,
    resetCards,
  };
}
