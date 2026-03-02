import { useMemo } from 'react';
import type { Match } from '../../types/match';
import './MatchFilters.css';

export type SortOption = 'matched_at' | 'rating' | 'release_year';

interface MatchFiltersProps {
  matches: Match[];
  selectedGenre: string | null;
  selectedService: string | null;
  sortBy: SortOption;
  showWatched: boolean;
  onGenreChange: (genre: string | null) => void;
  onServiceChange: (service: string | null) => void;
  onSortChange: (sort: SortOption) => void;
  onShowWatchedChange: (show: boolean) => void;
}

export function MatchFilters({
  matches,
  selectedGenre,
  selectedService,
  sortBy,
  showWatched,
  onGenreChange,
  onServiceChange,
  onSortChange,
  onShowWatchedChange,
}: MatchFiltersProps) {
  const genres = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => m.genre_names.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [matches]);

  const services = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => m.streaming_services.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [matches]);

  const formatServiceName = (id: string) => {
    const names: Record<string, string> = {
      netflix: 'Netflix',
      hulu: 'Hulu',
      disney_plus: 'Disney+',
      hbo_max: 'HBO Max',
      amazon_prime: 'Prime',
      apple_tv: 'Apple TV+',
      peacock: 'Peacock',
      paramount_plus: 'Paramount+',
    };
    return names[id] || id;
  };

  return (
    <div className="match-filters">
      <div className="match-filters__row">
        <div className="match-filters__chips">
          {genres.length > 0 && (
            <>
              <button
                className={`match-filters__chip ${selectedGenre === null ? 'match-filters__chip--active' : ''}`}
                onClick={() => onGenreChange(null)}
              >
                All Genres
              </button>
              {genres.map((genre) => (
                <button
                  key={genre}
                  className={`match-filters__chip ${selectedGenre === genre ? 'match-filters__chip--active' : ''}`}
                  onClick={() => onGenreChange(selectedGenre === genre ? null : genre)}
                >
                  {genre}
                </button>
              ))}
            </>
          )}
          {services.length > 0 && genres.length > 0 && (
            <span className="match-filters__divider" />
          )}
          {services.map((service) => (
            <button
              key={service}
              className={`match-filters__chip ${selectedService === service ? 'match-filters__chip--active' : ''}`}
              onClick={() => onServiceChange(selectedService === service ? null : service)}
            >
              {formatServiceName(service)}
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
          <option value="release_year">Release Year</option>
        </select>

        <label className="match-filters__toggle">
          <input
            type="checkbox"
            checked={showWatched}
            onChange={(e) => onShowWatchedChange(e.target.checked)}
          />
          <span className="match-filters__toggle-label">Show watched</span>
        </label>
      </div>
    </div>
  );
}
