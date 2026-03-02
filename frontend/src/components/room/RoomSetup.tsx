import { useState } from 'react';
import { STREAMING_SERVICES } from '../../utils/constants';
import { Button } from '../ui/Button';
import './RoomSetup.css';

interface RoomSetupProps {
  onComplete: (services: string[]) => void;
}

export function RoomSetup({ onComplete }: RoomSetupProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <div className="room-setup">
      <h2 className="room-setup__title">Your Streaming Services</h2>
      <p className="room-setup__subtitle">
        Select the services you subscribe to. We'll only show titles you can actually watch.
      </p>
      <div className="room-setup__grid">
        {STREAMING_SERVICES.map((service) => (
          <button
            key={service.id}
            className={`room-setup__service ${selected.includes(service.id) ? 'room-setup__service--active' : ''}`}
            onClick={() => toggle(service.id)}
            type="button"
          >
            {service.name}
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
        Skip for now
      </Button>
    </div>
  );
}
