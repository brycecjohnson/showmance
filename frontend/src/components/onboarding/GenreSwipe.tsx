import { useState, useCallback, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { GENRES, SWIPE_THRESHOLD, CARD_ROTATION_FACTOR } from '../../utils/constants';
import { Button } from '../ui/Button';
import './GenreSwipe.css';

const GENRE_COLORS: Record<string, string> = {
  Action: '#e53935',
  Comedy: '#fdd835',
  Thriller: '#37474f',
  'Sci-Fi': '#7c4dff',
  Horror: '#880e4f',
  Romance: '#ec407a',
  Drama: '#5c6bc0',
  Documentary: '#00897b',
  Animation: '#ff7043',
  Crime: '#455a64',
  Mystery: '#8e24aa',
  Fantasy: '#26c6da',
  Reality: '#66bb6a',
  Western: '#8d6e63',
  Musical: '#ab47bc',
  War: '#78909c',
  Family: '#42a5f5',
  History: '#a1887f',
};

interface GenreSwipeProps {
  onComplete: (liked: string[], disliked: string[]) => void;
}

export function GenreSwipe({ onComplete }: GenreSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-CARD_ROTATION_FACTOR, CARD_ROTATION_FACTOR]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const genre = GENRES[currentIndex];
  const isComplete = currentIndex >= GENRES.length;
  const progress = Math.min(currentIndex / GENRES.length, 1);

  const advanceCard = useCallback(
    (direction: 'left' | 'right') => {
      const genreName = GENRES[currentIndex];
      if (direction === 'right') {
        setLiked((prev) => [...prev, genreName]);
      } else {
        setDisliked((prev) => [...prev, genreName]);
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
      <div className="genre-swipe genre-swipe--done">
        <h2 className="genre-swipe__title">Nice!</h2>
        <p className="genre-swipe__subtitle">
          You liked {liked.length} genre{liked.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => onComplete(liked, disliked)} fullWidth size="lg">
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="genre-swipe">
      <div className="genre-swipe__header">
        <h2 className="genre-swipe__title">Genre Vibes</h2>
        <p className="genre-swipe__subtitle">
          Swipe right on genres you love, left to skip
        </p>
        <div className="genre-swipe__progress">
          <div
            className="genre-swipe__progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="genre-swipe__count">
          {currentIndex + 1} / {GENRES.length}
        </p>
      </div>

      <div className="genre-swipe__deck">
        {/* Next card (static background) */}
        {currentIndex + 1 < GENRES.length && (
          <div
            className="genre-card genre-card--next"
            style={{
              backgroundColor: GENRE_COLORS[GENRES[currentIndex + 1]] || '#444',
            }}
          >
            <span className="genre-card__name">{GENRES[currentIndex + 1]}</span>
          </div>
        )}

        {/* Active card (draggable) */}
        <motion.div
          className="genre-card"
          style={{
            x,
            rotate,
            backgroundColor: GENRE_COLORS[genre] || '#444',
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
        >
          <motion.div className="genre-card__overlay genre-card__overlay--like" style={{ opacity: likeOpacity }}>
            LIKE
          </motion.div>
          <motion.div className="genre-card__overlay genre-card__overlay--nope" style={{ opacity: nopeOpacity }}>
            NOPE
          </motion.div>
          <span className="genre-card__name">{genre}</span>
        </motion.div>
      </div>

      <div className="genre-swipe__buttons">
        <button
          className="genre-swipe__btn genre-swipe__btn--nope"
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
          className="genre-swipe__btn genre-swipe__btn--like"
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
