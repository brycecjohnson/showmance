import { useCallback } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { TMDB_IMAGE_BASE } from '../../utils/constants';
import type { Card } from '../../types/card';
import './CardDetail.css';

const STREAMING_LABELS: Record<string, string> = {
  netflix: 'Netflix',
  hulu: 'Hulu',
  disney_plus: 'Disney+',
  hbo_max: 'HBO Max',
  amazon_prime: 'Prime',
  apple_tv: 'Apple TV+',
  peacock: 'Peacock',
  paramount_plus: 'Paramount+',
};

interface CardDetailProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  /** Swipe deck mode: show Like/Pass buttons */
  onLike?: () => void;
  onPass?: () => void;
  /** Match list mode: show Mark as watched button */
  onMarkWatched?: () => void;
  isWatched?: boolean;
}

export function CardDetail({
  card,
  isOpen,
  onClose,
  onLike,
  onPass,
  onMarkWatched,
  isWatched,
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

  const trailerQuery = card
    ? encodeURIComponent(`${card.title} ${card.release_year} official trailer`)
    : '';

  const isSwipeMode = !!(onLike && onPass);
  const isMatchMode = !!onMarkWatched;

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
                {card.poster_path ? (
                  <img
                    className="card-detail__poster"
                    src={`${TMDB_IMAGE_BASE}/w500${card.poster_path}`}
                    alt={card.title}
                    draggable={false}
                  />
                ) : (
                  <div className="card-detail__poster card-detail__poster--empty">
                    No Image
                  </div>
                )}
              </div>

              <div className="card-detail__body">
                <h2 className="card-detail__title">{card.title}</h2>

                <div className="card-detail__meta">
                  <span className="card-detail__year">{card.release_year}</span>
                  <span className="card-detail__rating">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path d="M10 1l2.39 4.84L17.3 6.7l-3.65 3.56.86 5.03L10 13.01l-4.51 2.28.86-5.03L2.7 6.7l4.91-.86L10 1z" />
                    </svg>
                    {card.rating.toFixed(1)}
                  </span>
                  {card.media_type === 'movie' && card.runtime && (
                    <span className="card-detail__runtime">
                      {Math.floor(card.runtime / 60)}h {card.runtime % 60}m
                    </span>
                  )}
                  {card.media_type === 'tv' && card.seasons_count && (
                    <span className="card-detail__seasons">
                      {card.seasons_count} season{card.seasons_count !== 1 ? 's' : ''}
                      {card.episodes_count ? ` (${card.episodes_count} ep)` : ''}
                    </span>
                  )}
                </div>

                <div className="card-detail__genres">
                  {card.genre_names.map((genre) => (
                    <span key={genre} className="card-detail__genre-tag">{genre}</span>
                  ))}
                </div>

                {card.director && (
                  <div className="card-detail__director">
                    <span className="card-detail__label">Directed by</span>
                    <span className="card-detail__director-name">{card.director}</span>
                  </div>
                )}

                <p className="card-detail__overview">{card.overview}</p>

                {card.cast && card.cast.length > 0 && (
                  <div className="card-detail__cast">
                    <h3 className="card-detail__section-title">Cast</h3>
                    <div className="card-detail__cast-list">
                      {card.cast.slice(0, 6).map((member) => (
                        <div key={member.name} className="card-detail__cast-member">
                          <div className="card-detail__cast-avatar">
                            {member.profile_path ? (
                              <img
                                src={`${TMDB_IMAGE_BASE}/w185${member.profile_path}`}
                                alt={member.name}
                              />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            )}
                          </div>
                          <div className="card-detail__cast-info">
                            <span className="card-detail__cast-name">{member.name}</span>
                            <span className="card-detail__cast-character">{member.character}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {card.streaming_services && card.streaming_services.length > 0 && (
                  <div className="card-detail__streaming">
                    <h3 className="card-detail__section-title">Where to Watch</h3>
                    <div className="card-detail__service-list">
                      {card.streaming_services.map((s) => (
                        <span key={s} className="card-detail__service-tag">
                          {STREAMING_LABELS[s] || s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  className="card-detail__trailer"
                  href={`https://www.youtube.com/results?search_query=${trailerQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Trailer
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
                    className={`card-detail__action-btn card-detail__action-btn--watched ${isWatched ? 'card-detail__action-btn--done' : ''}`}
                    onClick={isWatched ? undefined : onMarkWatched}
                    type="button"
                    aria-label={isWatched ? 'Already watched' : 'Mark as watched'}
                    disabled={isWatched}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {isWatched ? 'Watched' : 'Mark as Watched'}
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
