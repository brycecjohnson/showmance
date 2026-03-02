import { useEffect, useCallback, useRef } from 'react';
import { SwipeCard } from './SwipeCard';
import { useCards } from '../../hooks/useCards';
import type { SwipeDirection } from '../../types/swipe';
import './CardStack.css';

const VISIBLE_CARDS = 3;

interface CardStackProps {
  onSwipe: (tmdbId: number, direction: SwipeDirection) => void;
  triggerRef: React.MutableRefObject<((dir: 'left' | 'right') => void) | null>;
}

export function CardStack({ onSwipe, triggerRef }: CardStackProps) {
  const { cards, isLoading, hasMore, fetchCards, removeTopCard } = useCards();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCards();
    }
  }, [fetchCards]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const topCard = cards[0];
      if (!topCard) return;
      removeTopCard();
      onSwipe(topCard.tmdb_id, direction);
    },
    [cards, removeTopCard, onSwipe],
  );

  // Expose a trigger function so parent can programmatically swipe
  useEffect(() => {
    triggerRef.current = (dir: 'left' | 'right') => {
      const fn = (SwipeCard as unknown as Record<string, unknown>)._triggerSwipe as
        | ((d: 'left' | 'right') => void)
        | undefined;
      if (fn) fn(dir);
    };
    return () => {
      triggerRef.current = null;
    };
  }, [triggerRef, cards]);

  if (isLoading && cards.length === 0) {
    return (
      <div className="card-stack card-stack--loading">
        <div className="card-stack__skeleton" />
        <div className="card-stack__skeleton card-stack__skeleton--back" />
      </div>
    );
  }

  if (cards.length === 0 && !hasMore) {
    return (
      <div className="card-stack card-stack--empty">
        <p className="card-stack__empty-title">All caught up!</p>
        <p className="card-stack__empty-subtitle">
          Check back later for more titles to swipe.
        </p>
      </div>
    );
  }

  const visibleCards = cards.slice(0, VISIBLE_CARDS);

  return (
    <div className="card-stack">
      {visibleCards.map((card, index) => (
        <SwipeCard
          key={card.tmdb_id}
          card={card}
          onSwipe={handleSwipe}
          isTop={index === 0}
          stackIndex={index}
        />
      ))}
    </div>
  );
}
