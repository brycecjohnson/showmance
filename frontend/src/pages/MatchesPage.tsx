import { ModeToggle } from '../components/layout/ModeToggle';
import './MatchesPage.css';

export function MatchesPage() {
  return (
    <div className="matches-page">
      <header className="matches-page__header">
        <h1 className="matches-page__title">Matches</h1>
        <ModeToggle />
      </header>
      <div className="matches-page__list">
        <p className="matches-page__placeholder">
          Match list will be built in Phase 3.
        </p>
      </div>
    </div>
  );
}
