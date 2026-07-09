import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomCodeChip } from '../components/ui/RoomCodeChip';
import { MatchList } from '../components/matches/MatchList';
import { TonightsPick } from '../components/matches/TonightsPick';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useRoomContext } from '../context/RoomContext';
import { useMatches } from '../hooks/useMatches';
import { setLastSeenMatches } from '../utils/storage';
import './MatchesPage.css';

export function MatchesPage() {
  const navigate = useNavigate();
  const [showPick, setShowPick] = useState(false);
  const { isSolo } = useRoomContext();
  // Single source of truth for this screen: MatchList, the unvisited-count
  // badge, and Tonight's Pick all read/act on the same matches state, so a
  // markVisited from any of them is immediately reflected everywhere else
  // (previously each owned a separate useMatches() and could go stale).
  const { matches, isLoading, fetchMatches, markVisited, pickTonight } = useMatches();

  useEffect(() => {
    // Opening this screen clears the "new match" badge on the bottom nav.
    fetchMatches().then(() => setLastSeenMatches(new Date().toISOString()));
  }, [fetchMatches]);

  const unvisitedCount = useMemo(
    () => matches.filter((m) => !m.visited).length,
    [matches],
  );

  return (
    <div className="matches-page">
      <header className="matches-page__header">
        <div className="matches-page__title-row">
          <h1 className="matches-page__title">{isSolo ? 'Your Picks' : 'Places to Try'}</h1>
          <Badge count={unvisitedCount} />
        </div>
        <div className="matches-page__controls">
          <RoomCodeChip />
          <button
            className="settings-icon-btn"
            onClick={() => navigate('/settings')}
            type="button"
            aria-label="Settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="matches-page__pick-bar">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowPick(true)}
          className="matches-page__pick-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 2l2.09 6.26L20.18 9l-5 4.09L16.82 20 12 16.36 7.18 20l1.64-6.91L3.82 9l6.09-.74L12 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tonight's Pick
        </Button>
      </div>

      <MatchList matches={matches} isLoading={isLoading} onMarkVisited={markVisited} />

      <TonightsPick
        isOpen={showPick}
        onClose={() => setShowPick(false)}
        onPick={pickTonight}
        onVisited={markVisited}
      />
    </div>
  );
}
