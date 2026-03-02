import { useState } from 'react';
import { motion } from 'framer-motion';
import { TMDB_IMAGE_BASE } from '../../utils/constants';
import { PosterImage } from '../ui/PosterImage';
import type { Match } from '../../types/match';
import './MatchItem.css';

interface MatchItemProps {
  match: Match;
  onMarkWatched: (tmdbId: number) => void;
  onTap?: (match: Match) => void;
}

export function MatchItem({ match, onMarkWatched, onTap }: MatchItemProps) {
  const [confirming, setConfirming] = useState(false);

  const handleWatchedClick = () => {
    if (match.watched) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onMarkWatched(match.tmdb_id);
    setConfirming(false);
  };

  const matchDate = new Date(match.matched_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      className={`match-item ${match.watched ? 'match-item--watched' : ''}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
    >
      <button
        className="match-item__tap-area"
        onClick={() => onTap?.(match)}
        type="button"
        aria-label={`View details for ${match.title}`}
      >
        <div className="match-item__poster">
          {match.poster_path ? (
            <PosterImage
              src={`${TMDB_IMAGE_BASE}/w200${match.poster_path}`}
              alt={match.title}
              lazy
            />
          ) : (
            <div className="match-item__poster-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
              </svg>
            </div>
          )}
        </div>

        <div className="match-item__content">
          <h3 className="match-item__title">{match.title}</h3>
          <div className="match-item__meta">
            <span className="match-item__year">{match.release_year}</span>
            <span className="match-item__rating">
              <svg className="match-item__star" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path d="M10 1l2.39 4.84L17.3 6.7l-3.65 3.56.86 5.03L10 13.01l-4.51 2.28.86-5.03L2.7 6.7l4.91-.86L10 1z" />
              </svg>
              {match.rating.toFixed(1)}
            </span>
          </div>
          <div className="match-item__genres">
            {match.genre_names.slice(0, 2).map((genre) => (
              <span key={genre} className="match-item__genre-tag">{genre}</span>
            ))}
          </div>
          <span className="match-item__date">Matched {matchDate}</span>
        </div>
      </button>

      <button
        className={`match-item__watched-btn ${confirming ? 'match-item__watched-btn--confirm' : ''} ${match.watched ? 'match-item__watched-btn--done' : ''}`}
        onClick={handleWatchedClick}
        onBlur={() => setConfirming(false)}
        aria-label={match.watched ? 'Watched' : confirming ? 'Tap again to confirm' : 'Mark as watched'}
      >
        {match.watched ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : confirming ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
      </button>
    </motion.div>
  );
}
