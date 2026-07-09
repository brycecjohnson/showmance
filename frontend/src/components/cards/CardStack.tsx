import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwipeCard } from './SwipeCard';
import { useCards } from '../../hooks/useCards';
import type { RestaurantCard } from '../../types/card';
import type { SwipeDirection } from '../../types/swipe';
import './CardStack.css';

const VISIBLE_CARDS = 3;

interface CardStackProps {
  onSwipe: (placeId: string, direction: SwipeDirection, card: RestaurantCard) => void;
  triggerRef: React.MutableRefObject<((dir: 'left' | 'right') => void) | null>;
  onCardTap?: (card: RestaurantCard) => void;
  onError?: (message: string) => void;
}

export function CardStack({ onSwipe, triggerRef, onCardTap, onError }: CardStackProps) {
  const navigate = useNavigate();
  const { cards, isLoading, hasMore, fetchCards, removeTopCard } = useCards();
  const hasFetched = useRef(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCards().catch(() => {
        setFetchError(true);
        onError?.('Failed to load restaurants. Check your connection.');
      });
    }
  }, [fetchCards, onError]);

  const handleRetry = useCallback(() => {
    setFetchError(false);
    fetchCards().catch(() => {
      setFetchError(true);
      onError?.('Still unable to load restaurants. Try again later.');
    });
  }, [fetchCards, onError]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const topCard = cards[0];
      if (!topCard) return;
      removeTopCard();
      onSwipe(topCard.place_id, direction, topCard);
    },
    [cards, removeTopCard, onSwipe],
  );

  // Ref to the top card's triggerSwipe function
  const topCardTrigger = useRef<((dir: 'left' | 'right') => void) | null>(null);

  // Expose a trigger function so parent can programmatically swipe
  useEffect(() => {
    triggerRef.current = (dir: 'left' | 'right') => {
      topCardTrigger.current?.(dir);
    };
    return () => {
      triggerRef.current = null;
    };
  }, [triggerRef]);

  if (isLoading && cards.length === 0) {
    return (
      <div className="card-stack card-stack--loading">
        <div className="card-stack__skeleton">
          <div className="card-stack__skeleton-poster" />
          <div className="card-stack__skeleton-info">
            <div className="card-stack__skeleton-line card-stack__skeleton-line--title" />
            <div className="card-stack__skeleton-line card-stack__skeleton-line--meta" />
            <div className="card-stack__skeleton-tags">
              <div className="card-stack__skeleton-tag" />
              <div className="card-stack__skeleton-tag" />
            </div>
          </div>
        </div>
        <div className="card-stack__skeleton card-stack__skeleton--back">
          <div className="card-stack__skeleton-poster" />
        </div>
      </div>
    );
  }

  if (fetchError && cards.length === 0) {
    return (
      <div className="card-stack card-stack--empty">
        <svg className="card-stack__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
        <p className="card-stack__empty-title">Something went wrong</p>
        <button className="card-stack__retry-btn" onClick={handleRetry} type="button">
          Tap to retry
        </button>
      </div>
    );
  }

  if (cards.length === 0 && !hasMore) {
    return (
      <div className="card-stack card-stack--empty">
        <p className="card-stack__empty-title">You've seen every spot nearby!</p>
        <p className="card-stack__empty-subtitle">
          Widen your search radius to discover more places.
        </p>
        <button
          className="card-stack__retry-btn"
          onClick={() => navigate('/settings')}
          type="button"
        >
          Widen radius
        </button>
      </div>
    );
  }

  const visibleCards = cards.slice(0, VISIBLE_CARDS);

  return (
    <div className="card-stack">
      {visibleCards.map((card, index) => (
        <SwipeCard
          key={card.place_id}
          card={card}
          onSwipe={handleSwipe}
          isTop={index === 0}
          stackIndex={index}
          onTap={onCardTap}
          triggerRef={index === 0 ? topCardTrigger : undefined}
        />
      ))}
    </div>
  );
}
