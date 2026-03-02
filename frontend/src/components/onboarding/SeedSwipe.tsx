import { useState, useCallback, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { SWIPE_THRESHOLD, CARD_ROTATION_FACTOR, TMDB_IMAGE_BASE } from '../../utils/constants';
import { Button } from '../ui/Button';
import './SeedSwipe.css';

interface SeedTitle {
  tmdb_id: number;
  title: string;
  year: number;
  rating: number;
  poster_path: string;
  media_type: 'movie' | 'tv';
}

const SEED_TITLES: SeedTitle[] = [
  { tmdb_id: 1396, title: 'Breaking Bad', year: 2008, rating: 8.9, poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg', media_type: 'tv' },
  { tmdb_id: 2316, title: 'The Office', year: 2005, rating: 8.6, poster_path: '/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg', media_type: 'tv' },
  { tmdb_id: 66732, title: 'Stranger Things', year: 2016, rating: 8.6, poster_path: '/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg', media_type: 'tv' },
  { tmdb_id: 546554, title: 'Knives Out', year: 2019, rating: 7.9, poster_path: '/pThyQovXQrw2m0s9x82twj48Jq4.jpg', media_type: 'movie' },
  { tmdb_id: 157336, title: 'Interstellar', year: 2014, rating: 8.4, poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', media_type: 'movie' },
  { tmdb_id: 136315, title: 'The Bear', year: 2022, rating: 8.4, poster_path: '/sHFlSuJq1s5Rp2gm4OrcM7EPr2C.jpg', media_type: 'tv' },
  { tmdb_id: 76331, title: 'Succession', year: 2018, rating: 8.5, poster_path: '/7HW47XbkNQ5fiwQFYGWdw9gs7LF.jpg', media_type: 'tv' },
  { tmdb_id: 550, title: 'Fight Club', year: 1999, rating: 8.4, poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', media_type: 'movie' },
  { tmdb_id: 680, title: 'Pulp Fiction', year: 1994, rating: 8.5, poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', media_type: 'movie' },
  { tmdb_id: 94997, title: 'House of the Dragon', year: 2022, rating: 8.4, poster_path: '/z2yahl2uefxDCl0nogcRBstwruJ.jpg', media_type: 'tv' },
  { tmdb_id: 572802, title: 'Aquaman and the Lost Kingdom', year: 2023, rating: 6.3, poster_path: '/8xV47NDrjdZDpkVcCFqkdHa3T5C.jpg', media_type: 'movie' },
  { tmdb_id: 238, title: 'The Godfather', year: 1972, rating: 8.7, poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', media_type: 'movie' },
  { tmdb_id: 100088, title: 'The Last of Us', year: 2023, rating: 8.6, poster_path: '/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', media_type: 'tv' },
  { tmdb_id: 27205, title: 'Inception', year: 2010, rating: 8.4, poster_path: '/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg', media_type: 'movie' },
  { tmdb_id: 1399, title: 'Game of Thrones', year: 2011, rating: 8.4, poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', media_type: 'tv' },
];

interface SeedSwipeProps {
  onComplete: (liked: number[], disliked: number[]) => void;
}

export function SeedSwipe({ onComplete }: SeedSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [disliked, setDisliked] = useState<number[]>([]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-CARD_ROTATION_FACTOR, CARD_ROTATION_FACTOR]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const seed = SEED_TITLES[currentIndex];
  const isComplete = currentIndex >= SEED_TITLES.length;
  const progress = Math.min(currentIndex / SEED_TITLES.length, 1);

  const advanceCard = useCallback(
    (direction: 'left' | 'right') => {
      const title = SEED_TITLES[currentIndex];
      if (direction === 'right') {
        setLiked((prev) => [...prev, title.tmdb_id]);
      } else {
        setDisliked((prev) => [...prev, title.tmdb_id]);
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
      <div className="seed-swipe seed-swipe--done">
        <h2 className="seed-swipe__title">Great taste!</h2>
        <p className="seed-swipe__subtitle">
          You liked {liked.length} title{liked.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => onComplete(liked, disliked)} fullWidth size="lg">
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="seed-swipe">
      <div className="seed-swipe__header">
        <h2 className="seed-swipe__title">Rate Some Titles</h2>
        <p className="seed-swipe__subtitle">
          Swipe right on titles you love, left to skip
        </p>
        <div className="seed-swipe__progress">
          <div
            className="seed-swipe__progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="seed-swipe__count">
          {currentIndex + 1} / {SEED_TITLES.length}
        </p>
      </div>

      <div className="seed-swipe__deck">
        {/* Next card (static background) */}
        {currentIndex + 1 < SEED_TITLES.length && (
          <div className="seed-card seed-card--next">
            <img
              className="seed-card__poster"
              src={`${TMDB_IMAGE_BASE}/w500${SEED_TITLES[currentIndex + 1].poster_path}`}
              alt={SEED_TITLES[currentIndex + 1].title}
            />
          </div>
        )}

        {/* Active card (draggable) */}
        <motion.div
          className="seed-card"
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
        >
          <motion.div className="seed-card__overlay seed-card__overlay--like" style={{ opacity: likeOpacity }}>
            LIKE
          </motion.div>
          <motion.div className="seed-card__overlay seed-card__overlay--nope" style={{ opacity: nopeOpacity }}>
            NOPE
          </motion.div>
          <img
            className="seed-card__poster"
            src={`${TMDB_IMAGE_BASE}/w500${seed.poster_path}`}
            alt={seed.title}
            draggable={false}
          />
          <div className="seed-card__info">
            <span className="seed-card__title">{seed.title}</span>
            <span className="seed-card__meta">
              {seed.year} &middot; {seed.rating.toFixed(1)}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="seed-swipe__buttons">
        <button
          className="seed-swipe__btn seed-swipe__btn--nope"
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
          className="seed-swipe__btn seed-swipe__btn--like"
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
