import { useState, useCallback } from 'react';
import { ModeToggle } from '../components/layout/ModeToggle';
import { MatchList } from '../components/matches/MatchList';
import { TonightsPick } from '../components/matches/TonightsPick';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useMatches } from '../hooks/useMatches';
import './MatchesPage.css';

export function MatchesPage() {
  const [matchCount, setMatchCount] = useState(0);
  const [showPick, setShowPick] = useState(false);
  const { pickTonight, markWatched } = useMatches();

  const handleMatchCount = useCallback((count: number) => {
    setMatchCount(count);
  }, []);

  return (
    <div className="matches-page">
      <header className="matches-page__header">
        <div className="matches-page__title-row">
          <h1 className="matches-page__title">Matches</h1>
          <Badge count={matchCount} />
        </div>
        <ModeToggle />
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

      <MatchList onMatchCount={handleMatchCount} />

      <TonightsPick
        isOpen={showPick}
        onClose={() => setShowPick(false)}
        onPick={pickTonight}
        onWatched={markWatched}
      />
    </div>
  );
}
