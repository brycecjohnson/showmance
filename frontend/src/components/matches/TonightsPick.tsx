import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { priceLabel } from '../../utils/constants';
import type { Match } from '../../types/match';
import './TonightsPick.css';

interface TonightsPickProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: () => Promise<Match | null>;
  onVisited: (placeId: string) => void;
}

export function TonightsPick({ isOpen, onClose, onPick, onVisited }: TonightsPickProps) {
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

  const handleEatHere = useCallback(() => {
    if (pick) {
      onVisited(pick.place_id);
      setPick(null);
      setRevealed(false);
      onClose();
    }
  }, [pick, onVisited, onClose]);

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

  const mapsHref = pick
    ? pick.maps_url ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pick.name} ${pick.address}`)}`
    : '#';

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
                <p className="tonights-pick__loading-text">Finding somewhere delicious...</p>
              </div>
            )}

            {!isLoading && !pick && (
              <div className="tonights-pick__empty">
                <p>No unvisited matches available.</p>
                <p className="tonights-pick__empty-sub">Keep swiping to build your list of places to try!</p>
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
                  {pick.photo_url && (
                    <img
                      className="tonights-pick__poster"
                      src={pick.photo_url}
                      alt={pick.name}
                    />
                  )}

                  <h3 className="tonights-pick__title">{pick.name}</h3>

                  <div className="tonights-pick__meta">
                    <span className="tonights-pick__rating">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path d="M10 1l2.39 4.84L17.3 6.7l-3.65 3.56.86 5.03L10 13.01l-4.51 2.28.86-5.03L2.7 6.7l4.91-.86L10 1z" />
                      </svg>
                      {pick.rating.toFixed(1)}
                    </span>
                    {pick.price_level && <span>{priceLabel(pick.price_level)}</span>}
                    {pick.distance_mi !== null && <span>{pick.distance_mi.toFixed(1)} mi</span>}
                  </div>

                  <div className="tonights-pick__genres">
                    {pick.cuisines.map((cuisine) => (
                      <span key={cuisine} className="tonights-pick__genre-tag">{cuisine}</span>
                    ))}
                  </div>

                  <a
                    className="tonights-pick__directions"
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pick.address}
                  </a>
                </motion.div>
              </AnimatePresence>
            )}

            {!isLoading && pick && (
              <div className="tonights-pick__actions">
                <Button onClick={handleEatHere} fullWidth>
                  Let's eat here!
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
