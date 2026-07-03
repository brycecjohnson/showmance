import { useMemo, useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMatches } from '../../hooks/useMatches';
import { MatchItem } from './MatchItem';
import { MatchFilters, type SortOption } from './MatchFilters';
import { CardDetail } from '../cards/CardDetail';
import type { RestaurantCard } from '../../types/card';
import type { Match } from '../../types/match';
import './MatchList.css';

interface MatchListProps {
  onMatchCount?: (count: number) => void;
}

export function MatchList({ onMatchCount }: MatchListProps) {
  const { matches, isLoading, fetchMatches, markVisited } = useMatches();

  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('matched_at');
  const [showVisited, setShowVisited] = useState(false);
  const [detailMatch, setDetailMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const filtered = useMemo(() => {
    let result = matches;

    if (!showVisited) {
      result = result.filter((m) => !m.visited);
    }

    if (selectedCuisine) {
      result = result.filter((m) => m.cuisines.includes(selectedCuisine));
    }

    if (selectedPrice) {
      result = result.filter((m) => m.price_level === selectedPrice);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          return (a.distance_mi ?? Infinity) - (b.distance_mi ?? Infinity);
        case 'matched_at':
        default:
          return new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime();
      }
    });

    return result;
  }, [matches, showVisited, selectedCuisine, selectedPrice, sortBy]);

  const unvisitedCount = useMemo(
    () => matches.filter((m) => !m.visited).length,
    [matches],
  );

  useEffect(() => {
    onMatchCount?.(unvisitedCount);
  }, [unvisitedCount, onMatchCount]);

  const handleMarkVisited = useCallback(
    (placeId: string) => {
      markVisited(placeId);
    },
    [markVisited],
  );

  const handleMatchTap = useCallback((match: Match) => {
    setDetailMatch(match);
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetailMatch(null);
  }, []);

  const handleDetailMarkVisited = useCallback(() => {
    if (detailMatch) {
      markVisited(detailMatch.place_id);
      setDetailMatch(null);
    }
  }, [detailMatch, markVisited]);

  const detailCard: RestaurantCard | null = detailMatch
    ? {
        place_id: detailMatch.place_id,
        name: detailMatch.name,
        photo_url: detailMatch.photo_url,
        cuisines: detailMatch.cuisines,
        rating: detailMatch.rating,
        rating_count: 0,
        price_level: detailMatch.price_level,
        address: detailMatch.address,
        distance_mi: detailMatch.distance_mi,
        maps_url: detailMatch.maps_url,
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

  const allVisited = unvisitedCount === 0 && !showVisited;

  return (
    <div className="match-list">
      <MatchFilters
        matches={matches}
        selectedCuisine={selectedCuisine}
        selectedPrice={selectedPrice}
        sortBy={sortBy}
        showVisited={showVisited}
        onCuisineChange={setSelectedCuisine}
        onPriceChange={setSelectedPrice}
        onSortChange={setSortBy}
        onShowVisitedChange={setShowVisited}
      />

      {allVisited ? (
        <div className="match-list__empty">
          <p className="match-list__empty-text">You've been everywhere on your list!</p>
          <p className="match-list__empty-sub">Toggle "Show visited" to see your history.</p>
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
                key={match.place_id}
                match={match}
                onMarkVisited={handleMarkVisited}
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
        onMarkVisited={handleDetailMarkVisited}
        isVisited={detailMatch?.visited}
      />
    </div>
  );
}
