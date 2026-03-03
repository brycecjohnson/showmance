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
  const { roomCode, createRoom } = useRoomContext();
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
            <div className="landing__divider">
              <span>or</span>
            </div>
            <Button variant="secondary" fullWidth size="lg" onClick={handleSolo}>
              Solo Mode
            </Button>
            <p className="landing__solo-hint">Pick shows for yourself</p>
          </>
        )}

        {view === 'join' && (
          <JoinRoom onJoined={handleJoined} onBack={() => setView('home')} />
        )}

        {view === 'created' && roomCode && (
          <RoomCreated roomCode={roomCode} onContinue={handleContinue} />
        )}
      </div>

      <footer className="landing__attribution">
        <img src="/tmdb-logo.svg" alt="TMDB" className="landing__tmdb-logo" />
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </footer>
    </div>
  );
}
