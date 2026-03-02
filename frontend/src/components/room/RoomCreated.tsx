import { useState } from 'react';
import { Button } from '../ui/Button';
import './RoomCreated.css';

interface RoomCreatedProps {
  roomCode: string;
  onContinue: () => void;
}

export function RoomCreated({ roomCode, onContinue }: RoomCreatedProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — select the text
    }
  };

  return (
    <div className="room-created">
      <h2 className="room-created__heading">Room Created!</h2>
      <p className="room-created__instruction">
        Share this code with your partner
      </p>
      <button className="room-created__code" onClick={handleCopy} type="button">
        {roomCode}
      </button>
      <p className="room-created__hint">
        {copied ? 'Copied!' : 'Tap to copy'}
      </p>
      <Button onClick={onContinue} fullWidth size="lg">
        Continue to Setup
      </Button>
    </div>
  );
}
