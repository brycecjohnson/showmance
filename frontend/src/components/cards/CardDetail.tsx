import { useCallback } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { priceLabel } from '../../utils/constants';
import type { RestaurantCard } from '../../types/card';
import './CardDetail.css';

interface CardDetailProps {
  card: RestaurantCard | null;
  isOpen: boolean;
  onClose: () => void;
  /** Swipe deck mode: show Like/Pass buttons */
  onLike?: () => void;
  onPass?: () => void;
  /** Match list mode: show Mark as visited button */
  onMarkVisited?: () => void;
  isVisited?: boolean;
}

export function CardDetail({
  card,
  isOpen,
  onClose,
  onLike,
  onPass,
  onMarkVisited,
  isVisited,
}: CardDetailProps) {
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > 100) {
        onClose();
      }
    },
    [onClose],
  );

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const isSwipeMode = !!(onLike && onPass);
  const isMatchMode = !!onMarkVisited;

  const mapsHref = card
    ? card.maps_url ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${card.name} ${card.address}`)}`
    : '#';

  return (
    <AnimatePresence>
      {isOpen && card && (
        <motion.div
          className="card-detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="card-detail"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-detail__handle" />

            <div className="card-detail__scroll">
              <div className="card-detail__hero">
                {card.photo_url ? (
                  <img
                    className="card-detail__poster"
                    src={card.photo_url}
                    alt={card.name}
                    draggable={false}
                  />
                ) : (
                  <div className="card-detail__poster card-detail__poster--empty">
                    No Photo
                  </div>
                )}
              </div>

              <div className="card-detail__body">
                <h2 className="card-detail__title">{card.name}</h2>

                <div className="card-detail__meta">
                  <span className="card-detail__rating">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path d="M10 1l2.39 4.84L17.3 6.7l-3.65 3.56.86 5.03L10 13.01l-4.51 2.28.86-5.03L2.7 6.7l4.91-.86L10 1z" />
                    </svg>
                    {card.rating.toFixed(1)}
                    {card.rating_count > 0 && (
                      <span className="card-detail__rating-count">
                        ({card.rating_count.toLocaleString()})
                      </span>
                    )}
                  </span>
                  {card.price_level && (
                    <span className="card-detail__price">{priceLabel(card.price_level)}</span>
                  )}
                  {card.distance_mi !== null && (
                    <span className="card-detail__distance">{card.distance_mi.toFixed(1)} mi</span>
                  )}
                  {card.open_now !== undefined && (
                    <span
                      className={`card-detail__open ${card.open_now ? 'card-detail__open--yes' : 'card-detail__open--no'}`}
                    >
                      {card.open_now ? 'Open now' : 'Closed'}
                    </span>
                  )}
                </div>

                <div className="card-detail__genres">
                  {card.cuisines.map((cuisine) => (
                    <span key={cuisine} className="card-detail__genre-tag">{cuisine}</span>
                  ))}
                </div>

                {card.description && (
                  <p className="card-detail__overview">{card.description}</p>
                )}

                <div className="card-detail__address">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{card.address}</span>
                </div>

                {card.hours && card.hours.length > 0 && (
                  <div className="card-detail__hours">
                    <h3 className="card-detail__section-title">Hours</h3>
                    <ul className="card-detail__hours-list">
                      {card.hours.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(card.phone || card.website) && (
                  <div className="card-detail__contact">
                    {card.phone && (
                      <a className="card-detail__contact-link" href={`tel:${card.phone.replace(/[^+\d]/g, '')}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        {card.phone}
                      </a>
                    )}
                    {card.website && (
                      <a
                        className="card-detail__contact-link"
                        href={card.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                        </svg>
                        Website
                      </a>
                    )}
                  </div>
                )}

                <a
                  className="card-detail__trailer"
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 000-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 011-1h5V7.5l3.5 3.5z" />
                  </svg>
                  Directions
                </a>
              </div>

              {isSwipeMode && (
                <div className="card-detail__actions">
                  <button
                    className="card-detail__action-btn card-detail__action-btn--pass"
                    onClick={onPass}
                    type="button"
                    aria-label="Pass"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="24" height="24">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    Pass
                  </button>
                  <button
                    className="card-detail__action-btn card-detail__action-btn--like"
                    onClick={onLike}
                    type="button"
                    aria-label="Like"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="24" height="24">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    Like
                  </button>
                </div>
              )}

              {isMatchMode && (
                <div className="card-detail__actions">
                  <button
                    className={`card-detail__action-btn card-detail__action-btn--watched ${isVisited ? 'card-detail__action-btn--done' : ''}`}
                    onClick={isVisited ? undefined : onMarkVisited}
                    type="button"
                    aria-label={isVisited ? 'Already visited' : 'Mark as visited'}
                    disabled={isVisited}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {isVisited ? 'Visited' : 'Mark as Visited'}
                  </button>
                </div>
              )}
            </div>

            <button
              className="card-detail__close"
              onClick={onClose}
              type="button"
              aria-label="Close details"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
