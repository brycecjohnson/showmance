import { useCallback, useEffect, useRef, useState } from 'react';
import { ModeToggle } from '../components/layout/ModeToggle';
import { RoomCodeChip } from '../components/ui/RoomCodeChip';
import { CardStack } from '../components/cards/CardStack';
import { CardDetail } from '../components/cards/CardDetail';
import { MatchPopup } from '../components/ui/MatchPopup';
import { Toast } from '../components/ui/Toast';
import { useSwipe } from '../hooks/useSwipe';
import { useRoomContext } from '../context/RoomContext';
import { useToast } from '../hooks/useToast';
import type { Card } from '../types/card';
import type { SwipeDirection } from '../types/swipe';
import './SwipePage.css';

export function SwipePage() {
  const { swipe, clearResult } = useSwipe();
  const { isSolo } = useRoomContext();
  const triggerRef = useRef<((dir: 'left' | 'right') => void) | null>(null);
  const [matchInfo, setMatchInfo] = useState<{ title: string; posterPath: string | null } | null>(null);
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const { toast, showToast, clearToast } = useToast();
  // Keep a ref of the current visible cards so handleSwipe can find card data
  const cardsRef = useRef<Card[]>([]);

  const handleSwipe = useCallback(
    async (tmdbId: number, direction: SwipeDirection, card?: Card) => {
      // Card can be passed directly from CardStack, or looked up from ref
      const swipeCard = card ?? cardsRef.current.find((c) => c.tmdb_id === tmdbId);
      if (!swipeCard) return;
      try {
        const result = await swipe(swipeCard, direction);
        if (result.matched && result.match && !isSolo) {
          setMatchInfo({
            title: result.match.title,
            posterPath: result.match.poster_path,
          });
        }
      } catch {
        showToast('Swipe failed to save. Keep going — we\'ll retry.');
      }
    },
    [swipe, showToast, isSolo],
  );

  const handleCloseMatch = useCallback(() => {
    setMatchInfo(null);
    clearResult();
  }, [clearResult]);

  const handleCardTap = useCallback((card: Card) => {
    setDetailCard(card);
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetailCard(null);
  }, []);

  const handleDetailLike = useCallback(() => {
    if (detailCard) {
      setDetailCard(null);
      triggerRef.current?.('right');
    }
  }, [detailCard]);

  const handleDetailPass = useCallback(() => {
    if (detailCard) {
      setDetailCard(null);
      triggerRef.current?.('left');
    }
  }, [detailCard]);

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
        <div className="swipe-page__controls">
          <RoomCodeChip />
          <ModeToggle />
        </div>
      </header>

      <div className="swipe-page__deck">
        <CardStack onSwipe={handleSwipe} triggerRef={triggerRef} onCardTap={handleCardTap} onError={showToast} />
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

      <CardDetail
        card={detailCard}
        isOpen={detailCard !== null}
        onClose={handleDetailClose}
        onLike={handleDetailLike}
        onPass={handleDetailPass}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}
    </div>
  );
}
