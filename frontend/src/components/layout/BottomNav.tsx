import { NavLink } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import './BottomNav.css';

interface BottomNavProps {
  newMatchCount?: number;
}

export function BottomNav({ newMatchCount = 0 }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/swipe"
        className={({ isActive }) =>
          `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
        }
      >
        <svg className="bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9 12h6M12 9v6" />
        </svg>
        <span className="bottom-nav__label">Swipe</span>
      </NavLink>

      <NavLink
        to="/matches"
        className={({ isActive }) =>
          `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
        }
      >
        <div className="bottom-nav__icon-wrap">
          <svg className="bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <Badge count={newMatchCount} />
        </div>
        <span className="bottom-nav__label">Matches</span>
      </NavLink>
    </nav>
  );
}
