import { useCallback, useEffect, useRef, useState } from 'react';
import { ModeToggle } from '../components/layout/ModeToggle';
import { CardStack } from '../components/cards/CardStack';
import { MatchPopup } from '../components/ui/MatchPopup';
import { useSwipe } from '../hooks/useSwipe';
import { useCards } from '../hooks/useCards';
import type { SwipeDirection } from '../types/swipe';
import './SwipePage.css';

export function SwipePage() {
  const { swipe, clearResult } = useSwipe();
  const { cards } = useCards();
  const triggerRef = useRef<((dir: 'left' | 'right') => void) | null>(null);
  const [matchInfo, setMatchInfo] = useState<{ title: string; posterPath: string | null } | null>(null);

  const handleSwipe = useCallback(
    async (tmdbId: number, direction: SwipeDirection) => {
      const card = cards.find((c) => c.tmdb_id === tmdbId);
      if (!card) return;
      try {
        const result = await swipe(card, direction);
        if (result.matched && result.match) {
          setMatchInfo({
            title: result.match.title,
            posterPath: result.match.poster_path,
          });
        }
      } catch {
        // Swipe API failure is non-blocking — card is already removed
      }
    },
    [cards, swipe],
  );

  const handleCloseMatch = useCallback(() => {
    setMatchInfo(null);
    clearResult();
  }, [clearResult]);

  // Desktop keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        triggerRef.current?.('left');
      } else if (e.key === 'ArrowRight') {
        triggerRef.current?.('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="swipe-page">
      <header className="swipe-page__header">
        <h1 className="swipe-page__title">Showmance</h1>
        <ModeToggle />
      </header>

      <div className="swipe-page__deck">
        <CardStack onSwipe={handleSwipe} triggerRef={triggerRef} />
      </div>

      <div className="swipe-page__actions">
        <button
          className="swipe-page__btn swipe-page__btn--nope"
          onClick={() => triggerRef.current?.('left')}
          type="button"
          aria-label="Pass"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <button
          className="swipe-page__btn swipe-page__btn--like"
          onClick={() => triggerRef.current?.('right')}
          type="button"
          aria-label="Like"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>

      <MatchPopup
        isOpen={matchInfo !== null}
        title={matchInfo?.title ?? ''}
        posterPath={matchInfo?.posterPath ?? null}
        onClose={handleCloseMatch}
      />
    </div>
  );
}
