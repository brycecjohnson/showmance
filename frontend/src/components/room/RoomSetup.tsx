import { useState } from 'react';
import { PRICE_LEVELS } from '../../utils/constants';
import { Button } from '../ui/Button';
import './RoomSetup.css';

interface RoomSetupProps {
  onComplete: (priceLevels: number[]) => void;
}

export function RoomSetup({ onComplete }: RoomSetupProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (level: number) => {
    setSelected((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  return (
    <div className="room-setup">
      <h2 className="room-setup__title">What's Your Budget?</h2>
      <p className="room-setup__subtitle">
        Pick the price ranges you're comfortable with. We'll only show places that fit.
      </p>
      <div className="room-setup__grid">
        {PRICE_LEVELS.map((price) => (
          <button
            key={price.level}
            className={`room-setup__service ${selected.includes(price.level) ? 'room-setup__service--active' : ''}`}
            onClick={() => toggle(price.level)}
            type="button"
          >
            <span className="room-setup__price-label">{price.label}</span>
            <span className="room-setup__price-desc">{price.description}</span>
          </button>
        ))}
      </div>
      <Button
        onClick={() => onComplete(selected)}
        fullWidth
        size="lg"
        disabled={selected.length === 0}
      >
        Continue
      </Button>
      <Button
        variant="ghost"
        onClick={() => onComplete([])}
        fullWidth
      >
        Any price is fine
      </Button>
    </div>
  );
}
