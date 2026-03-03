import { useRoomContext } from '../../context/RoomContext';
import * as storage from '../../utils/storage';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import './CreateRoom.css';

interface CreateRoomProps {
  onCreated: () => void;
}

export function CreateRoom({ onCreated }: CreateRoomProps) {
  const { createRoom, isLoading, error } = useRoomContext();

  const handleCreate = async () => {
    await createRoom();
    if (storage.getRoomCode()) {
      onCreated();
    }
  };

  return (
    <div className="create-room">
      <Button onClick={handleCreate} disabled={isLoading} fullWidth size="lg">
        {isLoading ? <Spinner size="sm" /> : 'Create a Room'}
      </Button>
      {error && <p className="create-room__error">{error}</p>}
    </div>
  );
}
