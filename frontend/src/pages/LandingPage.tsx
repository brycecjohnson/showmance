import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../context/RoomContext';
import { Button } from '../components/ui/Button';
import { CreateRoom } from '../components/room/CreateRoom';
import { JoinRoom } from '../components/room/JoinRoom';
import { RoomCreated } from '../components/room/RoomCreated';
import './LandingPage.css';

type LandingView = 'home' | 'join' | 'created';

export function LandingPage() {
  const navigate = useNavigate();
  const { roomCode } = useRoomContext();
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

  const handleJoined = () => {
    navigate('/onboarding');
  };

  const handleContinue = () => {
    navigate('/onboarding');
  };

  return (
    <div className="landing">
      <div className="landing__content">
        <h1 className="landing__title">Showmance</h1>
        <p className="landing__tagline">Swipe together. Watch together.</p>
        <p className="landing__description">
          Find your next watch with your partner. Swipe on movies and TV shows
          — when you both swipe right, it's a match.
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
          </>
        )}

        {view === 'join' && (
          <JoinRoom onJoined={handleJoined} onBack={() => setView('home')} />
        )}

        {view === 'created' && roomCode && (
          <RoomCreated roomCode={roomCode} onContinue={handleContinue} />
        )}
      </div>
    </div>
  );
}
