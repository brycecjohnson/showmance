import { useState, useCallback, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { CUISINES, SWIPE_THRESHOLD, CARD_ROTATION_FACTOR } from '../../utils/constants';
import { Button } from '../ui/Button';
import './CuisineSwipe.css';

interface CuisineSwipeProps {
  onComplete: (liked: string[], disliked: string[]) => void;
}

export function CuisineSwipe({ onComplete }: CuisineSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-CARD_ROTATION_FACTOR, CARD_ROTATION_FACTOR]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const cuisine = CUISINES[currentIndex];
  const isComplete = currentIndex >= CUISINES.length;
  const progress = Math.min(currentIndex / CUISINES.length, 1);

  const advanceCard = useCallback(
    (direction: 'left' | 'right') => {
      const cuisineId = CUISINES[currentIndex].id;
      if (direction === 'right') {
        setLiked((prev) => [...prev, cuisineId]);
      } else {
        setDisliked((prev) => [...prev, cuisineId]);
      }
      setCurrentIndex((prev) => prev + 1);
      x.set(0);
    },
    [currentIndex, x],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const offset = info.offset.x;
      if (Math.abs(offset) > SWIPE_THRESHOLD) {
        const direction = offset > 0 ? 'right' : 'left';
        const flyTo = direction === 'right' ? 500 : -500;
        animate(x, flyTo, {
          duration: 0.3,
          onComplete: () => advanceCard(direction),
        });
      } else {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
      }
    },
    [x, advanceCard],
  );

  // Desktop keyboard support
  useEffect(() => {
    if (isComplete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        animate(x, 500, {
          duration: 0.3,
          onComplete: () => advanceCard('right'),
        });
      } else if (e.key === 'ArrowLeft') {
        animate(x, -500, {
          duration: 0.3,
          onComplete: () => advanceCard('left'),
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [x, advanceCard, isComplete]);

  if (isComplete) {
    return (
      <div className="cuisine-swipe cuisine-swipe--done">
        <h2 className="cuisine-swipe__title">Nice!</h2>
        <p className="cuisine-swipe__subtitle">
          You're craving {liked.length} cuisine{liked.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => onComplete(liked, disliked)} fullWidth size="lg">
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="cuisine-swipe">
      <div className="cuisine-swipe__header">
        <h2 className="cuisine-swipe__title">What Are You Craving?</h2>
        <p className="cuisine-swipe__subtitle">
          Swipe right on cuisines you love, left to skip
        </p>
        <div className="cuisine-swipe__progress">
          <div
            className="cuisine-swipe__progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="cuisine-swipe__count">
          {currentIndex + 1} / {CUISINES.length}
        </p>
      </div>

      <div className="cuisine-swipe__deck">
        {/* Next card (static background) */}
        {currentIndex + 1 < CUISINES.length && (
          <div
            className="cuisine-card cuisine-card--next"
            style={{ backgroundColor: CUISINES[currentIndex + 1].color }}
          >
            <span className="cuisine-card__emoji">{CUISINES[currentIndex + 1].emoji}</span>
            <span className="cuisine-card__name">{CUISINES[currentIndex + 1].name}</span>
          </div>
        )}

        {/* Active card (draggable) */}
        <motion.div
          className="cuisine-card"
          style={{
            x,
            rotate,
            backgroundColor: cuisine.color,
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
        >
          <motion.div className="cuisine-card__overlay cuisine-card__overlay--like" style={{ opacity: likeOpacity }}>
            YUM
          </motion.div>
          <motion.div className="cuisine-card__overlay cuisine-card__overlay--nope" style={{ opacity: nopeOpacity }}>
            NOPE
          </motion.div>
          <span className="cuisine-card__emoji">{cuisine.emoji}</span>
          <span className="cuisine-card__name">{cuisine.name}</span>
        </motion.div>
      </div>

      <div className="cuisine-swipe__buttons">
        <button
          className="cuisine-swipe__btn cuisine-swipe__btn--nope"
          onClick={() => {
            animate(x, -500, {
              duration: 0.3,
              onComplete: () => advanceCard('left'),
            });
          }}
          type="button"
          aria-label="Pass"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <button
          className="cuisine-swipe__btn cuisine-swipe__btn--like"
          onClick={() => {
            animate(x, 500, {
              duration: 0.3,
              onComplete: () => advanceCard('right'),
            });
          }}
          type="button"
          aria-label="Like"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
