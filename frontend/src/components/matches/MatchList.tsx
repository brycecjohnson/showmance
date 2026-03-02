import { useMemo, useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useModeContext } from '../../context/ModeContext';
import { useMatches } from '../../hooks/useMatches';
import { MatchItem } from './MatchItem';
import { MatchFilters, type SortOption } from './MatchFilters';
import { CardDetail } from '../cards/CardDetail';
import type { Card } from '../../types/card';
import type { Match } from '../../types/match';
import './MatchList.css';

interface MatchListProps {
  onMatchCount?: (count: number) => void;
}

export function MatchList({ onMatchCount }: MatchListProps) {
  const { mode } = useModeContext();
  const { matches, isLoading, fetchMatches, markWatched } = useMatches();

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('matched_at');
  const [showWatched, setShowWatched] = useState(false);
  const [detailMatch, setDetailMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Reset filters on mode change
  useEffect(() => {
    setSelectedGenre(null);
    setSelectedService(null);
  }, [mode]);

  const filtered = useMemo(() => {
    let result = matches;

    if (!showWatched) {
      result = result.filter((m) => !m.watched);
    }

    if (selectedGenre) {
      result = result.filter((m) => m.genre_names.includes(selectedGenre));
    }

    if (selectedService) {
      result = result.filter((m) => m.streaming_services.includes(selectedService));
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'release_year':
          return b.release_year - a.release_year;
        case 'matched_at':
        default:
          return new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime();
      }
    });

    return result;
  }, [matches, showWatched, selectedGenre, selectedService, sortBy]);

  const unwatchedCount = useMemo(
    () => matches.filter((m) => !m.watched).length,
    [matches],
  );

  useEffect(() => {
    onMatchCount?.(unwatchedCount);
  }, [unwatchedCount, onMatchCount]);

  const handleMarkWatched = useCallback(
    (tmdbId: number) => {
      markWatched(tmdbId);
    },
    [markWatched],
  );

  const handleMatchTap = useCallback((match: Match) => {
    setDetailMatch(match);
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetailMatch(null);
  }, []);

  const handleDetailMarkWatched = useCallback(() => {
    if (detailMatch) {
      markWatched(detailMatch.tmdb_id);
      setDetailMatch(null);
    }
  }, [detailMatch, markWatched]);

  const detailCard: Card | null = detailMatch
    ? {
        tmdb_id: detailMatch.tmdb_id,
        media_type: detailMatch.media_type,
        title: detailMatch.title,
        poster_path: detailMatch.poster_path,
        backdrop_path: null,
        overview: '',
        release_year: detailMatch.release_year,
        rating: detailMatch.rating,
        genre_ids: [],
        genre_names: detailMatch.genre_names,
        streaming_services: detailMatch.streaming_services,
      }
    : null;

  if (isLoading && matches.length === 0) {
    return (
      <div className="match-list__skeleton-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="match-list__skeleton-row">
            <div className="match-list__skeleton-poster" />
            <div className="match-list__skeleton-content">
              <div className="match-list__skeleton-line match-list__skeleton-line--title" />
              <div className="match-list__skeleton-line match-list__skeleton-line--meta" />
              <div className="match-list__skeleton-line match-list__skeleton-line--tags" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="match-list__empty">
        <p className="match-list__empty-text">No matches yet — keep swiping!</p>
      </div>
    );
  }

  const allWatched = unwatchedCount === 0 && !showWatched;

  return (
    <div className="match-list">
      <MatchFilters
        matches={matches}
        selectedGenre={selectedGenre}
        selectedService={selectedService}
        sortBy={sortBy}
        showWatched={showWatched}
        onGenreChange={setSelectedGenre}
        onServiceChange={setSelectedService}
        onSortChange={setSortBy}
        onShowWatchedChange={setShowWatched}
      />

      {allWatched ? (
        <div className="match-list__empty">
          <p className="match-list__empty-text">All caught up!</p>
          <p className="match-list__empty-sub">Toggle "Show watched" to see your history.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="match-list__empty">
          <p className="match-list__empty-text">No matches for these filters.</p>
        </div>
      ) : (
        <div className="match-list__items">
          <AnimatePresence mode="popLayout">
            {filtered.map((match) => (
              <MatchItem
                key={match.tmdb_id}
                match={match}
                onMarkWatched={handleMarkWatched}
                onTap={handleMatchTap}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CardDetail
        card={detailCard}
        isOpen={detailMatch !== null}
        onClose={handleDetailClose}
        onMarkWatched={handleDetailMarkWatched}
        isWatched={detailMatch?.watched}
      />
    </div>
  );
}
