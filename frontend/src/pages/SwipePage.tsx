import { ModeToggle } from '../components/layout/ModeToggle';
import './SwipePage.css';

export function SwipePage() {
  return (
    <div className="swipe-page">
      <header className="swipe-page__header">
        <h1 className="swipe-page__title">Showmance</h1>
        <ModeToggle />
      </header>
      <div className="swipe-page__deck">
        <p className="swipe-page__placeholder">
          Card deck will be built in Phase 2.
        </p>
      </div>
    </div>
  );
}
