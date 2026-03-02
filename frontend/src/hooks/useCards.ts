import { useCallback, useState } from 'react';
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

  const fetchCards = useCallback(async () => {
    if (!roomCode || isLoading) return;
    setIsLoading(true);
    try {
      const data = await getCards(roomCode, mode);
      setCards((prev) => [...prev, ...data.cards]);
      setHasMore(data.has_more);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, mode, isLoading]);

  const removeTopCard = useCallback(() => {
    setCards((prev) => {
      const next = prev.slice(1);
      if (next.length <= CARDS_PREFETCH_THRESHOLD && hasMore) {
        fetchCards();
      }
      return next;
    });
  }, [hasMore, fetchCards]);

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
