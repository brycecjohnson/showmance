import { useMemo } from 'react';
import { priceLabel } from '../../utils/constants';
import type { Match } from '../../types/match';
import './MatchFilters.css';

export type SortOption = 'matched_at' | 'rating' | 'distance';

interface MatchFiltersProps {
  matches: Match[];
  selectedCuisine: string | null;
  selectedPrice: number | null;
  sortBy: SortOption;
  showVisited: boolean;
  onCuisineChange: (cuisine: string | null) => void;
  onPriceChange: (price: number | null) => void;
  onSortChange: (sort: SortOption) => void;
  onShowVisitedChange: (show: boolean) => void;
}

export function MatchFilters({
  matches,
  selectedCuisine,
  selectedPrice,
  sortBy,
  showVisited,
  onCuisineChange,
  onPriceChange,
  onSortChange,
  onShowVisitedChange,
}: MatchFiltersProps) {
  const cuisines = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => m.cuisines.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [matches]);

  const prices = useMemo(() => {
    const set = new Set<number>();
    matches.forEach((m) => {
      if (m.price_level) set.add(m.price_level);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  return (
    <div className="match-filters">
      <div className="match-filters__row">
        <div className="match-filters__chips">
          {cuisines.length > 0 && (
            <>
              <button
                className={`match-filters__chip ${selectedCuisine === null ? 'match-filters__chip--active' : ''}`}
                onClick={() => onCuisineChange(null)}
              >
                All Cuisines
              </button>
              {cuisines.map((cuisine) => (
                <button
                  key={cuisine}
                  className={`match-filters__chip ${selectedCuisine === cuisine ? 'match-filters__chip--active' : ''}`}
                  onClick={() => onCuisineChange(selectedCuisine === cuisine ? null : cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </>
          )}
          {prices.length > 0 && cuisines.length > 0 && (
            <span className="match-filters__divider" />
          )}
          {prices.map((price) => (
            <button
              key={price}
              className={`match-filters__chip ${selectedPrice === price ? 'match-filters__chip--active' : ''}`}
              onClick={() => onPriceChange(selectedPrice === price ? null : price)}
            >
              {priceLabel(price)}
            </button>
          ))}
        </div>
      </div>

      <div className="match-filters__controls">
        <select
          className="match-filters__sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          <option value="matched_at">Date Matched</option>
          <option value="rating">Rating</option>
          <option value="distance">Distance</option>
        </select>

        <label className="match-filters__toggle">
          <input
            type="checkbox"
            checked={showVisited}
            onChange={(e) => onShowVisitedChange(e.target.checked)}
          />
          <span className="match-filters__toggle-label">Show visited</span>
        </label>
      </div>
    </div>
  );
}
