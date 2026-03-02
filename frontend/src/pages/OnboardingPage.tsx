import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModeContext } from '../context/ModeContext';
import { useRoomContext } from '../context/RoomContext';
import { ModeToggle } from '../components/layout/ModeToggle';
import { RoomSetup } from '../components/room/RoomSetup';
import { GenreSwipe } from '../components/onboarding/GenreSwipe';
import { EraSelect } from '../components/onboarding/EraSelect';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { savePreferences } from '../api/rooms';
import { isOnboardingComplete, setOnboardingComplete } from '../utils/storage';
import './OnboardingPage.css';

type Step = 'services' | 'mode' | 'genres' | 'eras' | 'saving';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { roomCode } = useRoomContext();
  const { mode } = useModeContext();
  const [step, setStep] = useState<Step>(
    isOnboardingComplete() ? 'mode' : 'services',
  );
  const [services, setServices] = useState<string[]>([]);
  const [genresLiked, setGenresLiked] = useState<string[]>([]);
  const [genresDisliked, setGenresDisliked] = useState<string[]>([]);

  // If onboarding already done, just show mode pick then go to swipe
  if (isOnboardingComplete()) {
    return (
      <div className="onboarding">
        <h2 className="onboarding__title">Ready to Swipe</h2>
        <p className="onboarding__subtitle">Pick your mode</p>
        <ModeToggle />
        <div className="onboarding__spacer" />
        <Button onClick={() => navigate('/swipe')} fullWidth size="lg">
          Start Swiping {mode === 'movie' ? 'Movies' : 'TV Shows'}
        </Button>
      </div>
    );
  }

  const handleServicesComplete = (selected: string[]) => {
    setServices(selected);
    setStep('mode');
  };

  const handleModeComplete = () => {
    setStep('genres');
  };

  const handleGenresComplete = (liked: string[], disliked: string[]) => {
    setGenresLiked(liked);
    setGenresDisliked(disliked);
    setStep('eras');
  };

  const handleErasComplete = async (eras: string[]) => {
    if (!roomCode) return;
    setStep('saving');
    try {
      await savePreferences(roomCode, {
        genres_liked: genresLiked,
        genres_disliked: genresDisliked,
        eras,
        streaming_services: services,
      });
      setOnboardingComplete(true);
      navigate('/swipe');
    } catch {
      // On error, go back to eras
      setStep('eras');
    }
  };

  return (
    <div className="onboarding">
      {step === 'services' && (
        <RoomSetup onComplete={handleServicesComplete} />
      )}

      {step === 'mode' && (
        <div className="onboarding__mode">
          <h2 className="onboarding__title">What are you looking for?</h2>
          <ModeToggle />
          <div className="onboarding__spacer" />
          <Button onClick={handleModeComplete} fullWidth size="lg">
            Continue with {mode === 'movie' ? 'Movies' : 'TV Shows'}
          </Button>
        </div>
      )}

      {step === 'genres' && (
        <GenreSwipe onComplete={handleGenresComplete} />
      )}

      {step === 'eras' && (
        <EraSelect onComplete={handleErasComplete} />
      )}

      {step === 'saving' && (
        <div className="onboarding__saving">
          <Spinner size="lg" />
          <p>Saving your preferences...</p>
        </div>
      )}
    </div>
  );
}
