import { useState } from 'react';
import { motion } from 'framer-motion';
import { priceLabel } from '../../utils/constants';
import { PosterImage } from '../ui/PosterImage';
import type { Match } from '../../types/match';
import './MatchItem.css';

interface MatchItemProps {
  match: Match;
  onMarkVisited: (placeId: string) => void;
  onTap?: (match: Match) => void;
}

export function MatchItem({ match, onMarkVisited, onTap }: MatchItemProps) {
  const [confirming, setConfirming] = useState(false);

  const handleVisitedClick = () => {
    if (match.visited) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onMarkVisited(match.place_id);
    setConfirming(false);
  };

  const matchDate = new Date(match.matched_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      className={`match-item ${match.visited ? 'match-item--watched' : ''}`}
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
        aria-label={`View details for ${match.name}`}
      >
        <div className="match-item__poster">
          {match.photo_url ? (
            <PosterImage
              src={match.photo_url}
              alt={match.name}
              lazy
            />
          ) : (
            <div className="match-item__poster-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
                <path d="M3 11l18-5v12L3 14v-3z" />
                <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
              </svg>
            </div>
          )}
        </div>

        <div className="match-item__content">
          <h3 className="match-item__title">{match.name}</h3>
          <div className="match-item__meta">
            <span className="match-item__rating">
              <svg className="match-item__star" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                <path d="M10 1l2.39 4.84L17.3 6.7l-3.65 3.56.86 5.03L10 13.01l-4.51 2.28.86-5.03L2.7 6.7l4.91-.86L10 1z" />
              </svg>
              {match.rating.toFixed(1)}
            </span>
            {match.price_level != null && (
              <span className="match-item__price">{priceLabel(match.price_level)}</span>
            )}
            {match.distance_mi !== null && (
              <span className="match-item__distance">{match.distance_mi.toFixed(1)} mi</span>
            )}
          </div>
          <div className="match-item__genres">
            {match.cuisines.slice(0, 2).map((cuisine) => (
              <span key={cuisine} className="match-item__genre-tag">{cuisine}</span>
            ))}
          </div>
          <span className="match-item__date">Matched {matchDate}</span>
        </div>
      </button>

      <button
        className={`match-item__watched-btn ${confirming ? 'match-item__watched-btn--confirm' : ''} ${match.visited ? 'match-item__watched-btn--done' : ''}`}
        onClick={handleVisitedClick}
        onBlur={() => setConfirming(false)}
        aria-label={match.visited ? 'Visited' : confirming ? 'Tap again to confirm' : 'Mark as visited'}
      >
        {match.visited || confirming ? (
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
