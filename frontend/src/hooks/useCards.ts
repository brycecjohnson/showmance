import { useCallback, useEffect, useState } from 'react';
import { getCards } from '../api/cards';
import { useRoomContext } from '../context/RoomContext';
import type { RestaurantCard } from '../types/card';
import { CARDS_PREFETCH_THRESHOLD } from '../utils/constants';

export function useCards() {
  const { roomCode } = useRoomContext();
  const [cards, setCards] = useState<RestaurantCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!roomCode || isLoading) return;
    setIsLoading(true);
    try {
      const data = await getCards(roomCode);
      setCards((prev) => {
        const existingIds = new Set(prev.map((c) => c.place_id));
        const newCards = data.cards.filter((c) => !existingIds.has(c.place_id));
        return [...prev, ...newCards];
      });
      setHasMore(data.has_more);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, isLoading]);

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
