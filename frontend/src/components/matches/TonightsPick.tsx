import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { TMDB_IMAGE_BASE } from '../../utils/constants';
import type { Match } from '../../types/match';
import './TonightsPick.css';

interface TonightsPickProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: () => Promise<Match | null>;
  onWatched: (tmdbId: number) => void;
}

const MOCK_SERVICES: Record<string, string> = {
  netflix: 'Netflix',
  hulu: 'Hulu',
  disney_plus: 'Disney+',
  hbo_max: 'HBO Max',
  amazon_prime: 'Prime',
  apple_tv: 'Apple TV+',
  peacock: 'Peacock',
  paramount_plus: 'Paramount+',
};

export function TonightsPick({ isOpen, onClose, onPick, onWatched }: TonightsPickProps) {
  const [pick, setPick] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [pickKey, setPickKey] = useState(0);

  const fetchPick = useCallback(async () => {
    setIsLoading(true);
    setRevealed(false);
    try {
      const result = await onPick();
      setPick(result);
      // Small delay then reveal
      setTimeout(() => setRevealed(true), 100);
      setPickKey((k) => k + 1);
    } finally {
      setIsLoading(false);
    }
  }, [onPick]);

  const handleOpen = useCallback(() => {
    if (!pick && !isLoading) {
      fetchPick();
    }
  }, [pick, isLoading, fetchPick]);

  const handleReroll = useCallback(() => {
    fetchPick();
  }, [fetchPick]);

  const handleWatchThis = useCallback(() => {
    if (pick) {
      onWatched(pick.tmdb_id);
      setPick(null);
      setRevealed(false);
      onClose();
    }
  }, [pick, onWatched, onClose]);

  const handleDismiss = useCallback(() => {
    setPick(null);
    setRevealed(false);
    onClose();
  }, [onClose]);

  // Trigger fetch when overlay opens
  useEffect(() => {
    if (isOpen && !pick && !isLoading) {
      handleOpen();
    }
  }, [isOpen, pick, isLoading, handleOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="tonights-pick-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        >
          <motion.div
            className="tonights-pick"
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="tonights-pick__heading">Tonight's Pick</h2>

            {isLoading && (
              <div className="tonights-pick__loading">
                <Spinner size="lg" />
                <p className="tonights-pick__loading-text">Finding something great...</p>
              </div>
            )}

            {!isLoading && !pick && (
              <div className="tonights-pick__empty">
                <p>No unwatched matches available.</p>
                <p className="tonights-pick__empty-sub">Keep swiping to build your match list!</p>
                <Button variant="secondary" onClick={handleDismiss}>
                  Close
                </Button>
              </div>
            )}

            {!isLoading && pick && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={pickKey}
                  className="tonights-pick__card"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={revealed ? { rotateY: 0, opacity: 1 } : { rotateY: 90, opacity: 0 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                >
                  {pick.poster_path && (
                    <img
                      className="tonights-pick__poster"
                      src={`${TMDB_IMAGE_BASE}/w500${pick.poster_path}`}
                      alt={pick.title}
                    />
                  )}

                  <h3 className="tonights-pick__title">{pick.title}</h3>

                  <div className="tonights-pick__meta">
                    <span>{pick.release_year}</span>
                    <span className="tonights-pick__rating">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path d="M10 1l2.39 4.84L17.3 6.7l-3.65 3.56.86 5.03L10 13.01l-4.51 2.28.86-5.03L2.7 6.7l4.91-.86L10 1z" />
                      </svg>
                      {pick.rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="tonights-pick__genres">
                    {pick.genre_names.map((genre) => (
                      <span key={genre} className="tonights-pick__genre-tag">{genre}</span>
                    ))}
                  </div>

                  {pick.streaming_services.length > 0 && (
                    <div className="tonights-pick__services">
                      {pick.streaming_services.map((s) => (
                        <span key={s} className="tonights-pick__service-tag">
                          {MOCK_SERVICES[s] || s}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {!isLoading && pick && (
              <div className="tonights-pick__actions">
                <Button onClick={handleWatchThis} fullWidth>
                  Let's watch this!
                </Button>
                <Button variant="secondary" onClick={handleReroll} fullWidth>
                  Re-roll
                </Button>
                <Button variant="ghost" onClick={handleDismiss} fullWidth>
                  Not tonight
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
