import { useModeContext } from '../../context/ModeContext';
import './ModeToggle.css';

export function ModeToggle() {
  const { mode, setMode } = useModeContext();

  return (
    <div className="mode-toggle">
      <button
        type="button"
        className={`mode-toggle__option ${mode === 'movie' ? 'mode-toggle__option--active' : ''}`}
        onClick={() => setMode('movie')}
      >
        Movie
      </button>
      <button
        type="button"
        className={`mode-toggle__option ${mode === 'tv' ? 'mode-toggle__option--active' : ''}`}
        onClick={() => setMode('tv')}
      >
        TV
      </button>
    </div>
  );
}
