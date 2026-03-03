import { useCallback, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { SWIPE_THRESHOLD, CARD_ROTATION_FACTOR, TMDB_IMAGE_BASE } from '../../utils/constants';
import { PosterImage } from '../ui/PosterImage';
import type { Card } from '../../types/card';
import './SwipeCard.css';

interface SwipeCardProps {
  card: Card;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
  stackIndex: number;
  onTap?: (card: Card) => void;
  triggerRef?: React.MutableRefObject<((dir: 'left' | 'right') => void) | null>;
}

export function SwipeCard({ card, onSwipe, isTop, stackIndex, onTap, triggerRef }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-CARD_ROTATION_FACTOR, CARD_ROTATION_FACTOR]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const offset = info.offset.x;
      if (Math.abs(offset) > SWIPE_THRESHOLD) {
        const direction = offset > 0 ? 'right' : 'left';
        const flyTo = direction === 'right' ? 500 : -500;
        animate(x, flyTo, {
          duration: 0.3,
          onComplete: () => onSwipe(direction),
        });
      } else {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
      }
    },
    [x, onSwipe],
  );

  const triggerSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const flyTo = direction === 'right' ? 500 : -500;
      animate(x, flyTo, {
        duration: 0.3,
        onComplete: () => onSwipe(direction),
      });
    },
    [x, onSwipe],
  );

  const handleTap = useCallback(() => {
    onTap?.(card);
  }, [onTap, card]);

  // Expose triggerSwipe via ref so CardStack can call it programmatically
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = triggerSwipe;
    }
    return () => {
      if (triggerRef) {
        triggerRef.current = null;
      }
    };
  }, [triggerRef, triggerSwipe]);

  const scale = 1 - stackIndex * 0.05;
  const translateY = stackIndex * 8;

  if (!isTop) {
    return (
      <div
        className="swipe-card swipe-card--stacked"
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          zIndex: 10 - stackIndex,
        }}
      >
        {card.poster_path ? (
          <PosterImage
            className="swipe-card__poster"
            src={`${TMDB_IMAGE_BASE}/w500${card.poster_path}`}
            alt={card.title}
          />
        ) : (
          <div className="swipe-card__poster swipe-card__poster--empty">
            No Image
          </div>
        )}
        <div className="swipe-card__info">
          <span className="swipe-card__title">{card.title}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="swipe-card"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
    >
      <motion.div
        className="swipe-card__overlay swipe-card__overlay--like"
        style={{ opacity: likeOpacity }}
      >
        LIKE
      </motion.div>
      <motion.div
        className="swipe-card__overlay swipe-card__overlay--nope"
        style={{ opacity: nopeOpacity }}
      >
        NOPE
      </motion.div>

      {card.poster_path ? (
        <PosterImage
          className="swipe-card__poster"
          src={`${TMDB_IMAGE_BASE}/w500${card.poster_path}`}
          alt={card.title}
          draggable={false}
        />
      ) : (
        <div className="swipe-card__poster swipe-card__poster--empty">
          No Image
        </div>
      )}

      <div className="swipe-card__info">
        <span className="swipe-card__title">{card.title}</span>
        <div className="swipe-card__meta">
          <span className="swipe-card__year">{card.release_year}</span>
          <span className="swipe-card__rating">
            <svg className="swipe-card__star" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 1l2.39 4.84L17.3 6.7l-3.65 3.56.86 5.03L10 13.01l-4.51 2.28.86-5.03L2.7 6.7l4.91-.86L10 1z" />
            </svg>
            {card.rating.toFixed(1)}
          </span>
        </div>
        {card.genre_names.length > 0 && (
          <div className="swipe-card__genres">
            {card.genre_names.slice(0, 3).map((genre) => (
              <span key={genre} className="swipe-card__genre-tag">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
