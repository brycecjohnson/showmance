import { useState } from 'react';
import { ERAS } from '../../utils/constants';
import { Button } from '../ui/Button';
import './EraSelect.css';

interface EraSelectProps {
  onComplete: (eras: string[]) => void;
}

export function EraSelect({ onComplete }: EraSelectProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    if (id === 'all') {
      setSelected((prev) => (prev.includes('all') ? [] : ['all']));
      return;
    }
    setSelected((prev) => {
      const without = prev.filter((e) => e !== 'all');
      return without.includes(id)
        ? without.filter((e) => e !== id)
        : [...without, id];
    });
  };

  return (
    <div className="era-select">
      <h2 className="era-select__title">Era Preferences</h2>
      <p className="era-select__subtitle">
        What decades do you want to see? Select one or more.
      </p>
      <div className="era-select__options">
        {ERAS.map((era) => (
          <button
            key={era.id}
            className={`era-select__pill ${selected.includes(era.id) ? 'era-select__pill--active' : ''}`}
            onClick={() => toggle(era.id)}
            type="button"
          >
            <span className="era-select__pill-label">{era.label}</span>
            <span className="era-select__pill-range">{era.range}</span>
          </button>
        ))}
      </div>
      <Button
        onClick={() => onComplete(selected.length > 0 ? selected : ['all'])}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}
