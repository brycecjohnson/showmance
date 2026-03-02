import { useState, type FormEvent } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import './JoinRoom.css';

interface JoinRoomProps {
  onJoined: () => void;
  onBack: () => void;
}

export function JoinRoom({ onJoined, onBack }: JoinRoomProps) {
  const { joinRoom, isLoading, error } = useRoomContext();
  const [code, setCode] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    await joinRoom(trimmed);
    onJoined();
  };

  const formatCode = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(clean);
  };

  return (
    <form className="join-room" onSubmit={handleSubmit}>
      <label className="join-room__label" htmlFor="room-code">
        Room Code
      </label>
      <input
        id="room-code"
        className="join-room__input"
        type="text"
        placeholder="SHOW-XXXX"
        value={code}
        onChange={(e) => formatCode(e.target.value)}
        maxLength={9}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {error && <p className="join-room__error">{error}</p>}
      <Button type="submit" disabled={isLoading || code.length < 6} fullWidth size="lg">
        {isLoading ? <Spinner size="sm" /> : 'Join Room'}
      </Button>
      <Button type="button" variant="ghost" onClick={onBack} fullWidth>
        Back
      </Button>
    </form>
  );
}
