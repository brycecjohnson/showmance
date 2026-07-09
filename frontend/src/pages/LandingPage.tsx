import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../context/RoomContext';
import { Button } from '../components/ui/Button';
import { CreateRoom } from '../components/room/CreateRoom';
import { JoinRoom } from '../components/room/JoinRoom';
import { RoomCreated } from '../components/room/RoomCreated';
import { Toast } from '../components/ui/Toast';
import './LandingPage.css';

type LandingView = 'home' | 'join' | 'created';

export function LandingPage() {
  const navigate = useNavigate();
  const { roomCode, createRoom, sessionEnded, clearSessionEnded } = useRoomContext();
  const [view, setView] = useState<LandingView>('home');

  // If already in a room, redirect to onboarding/swipe
  useEffect(() => {
    if (roomCode && view === 'home') {
      navigate('/onboarding', { replace: true });
    }
  }, [roomCode, view, navigate]);

  const handleCreated = () => {
    setView('created');
  };

  const handleSolo = async () => {
    await createRoom(true);
    navigate('/onboarding');
  };

  const handleJoined = () => {
    navigate('/onboarding');
  };

  const handleContinue = () => {
    navigate('/onboarding');
  };

  return (
    <div className="landing">
      <div className="landing__content">
        <h1 className="landing__title">Forkd</h1>
        <p className="landing__tagline">Swipe together. Eat together.</p>
        <p className="landing__description">
          Can't decide where to eat? Swipe on nearby restaurants with your
          partner — when you both swipe right, it's a match.
        </p>
      </div>

      <div className="landing__actions">
        {view === 'home' && (
          <>
            <CreateRoom onCreated={handleCreated} />
            <div className="landing__divider">
              <span>or</span>
            </div>
            <Button variant="secondary" fullWidth size="lg" onClick={() => setView('join')}>
              Join a Room
            </Button>
            <div className="landing__divider">
              <span>or</span>
            </div>
            <Button variant="secondary" fullWidth size="lg" onClick={handleSolo}>
              Solo Mode
            </Button>
            <p className="landing__solo-hint">Build your own list of places to try</p>
          </>
        )}

        {view === 'join' && (
          <JoinRoom onJoined={handleJoined} onBack={() => setView('home')} />
        )}

        {view === 'created' && roomCode && (
          <RoomCreated roomCode={roomCode} onContinue={handleContinue} />
        )}
      </div>

      {sessionEnded && (
        <Toast
          message="Your room session ended. Start a new one or join with a code."
          type="info"
          onClose={clearSessionEnded}
        />
      )}
    </div>
  );
}
