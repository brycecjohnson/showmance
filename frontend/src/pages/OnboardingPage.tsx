import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoomContext } from '../context/RoomContext';
import { RoomSetup } from '../components/room/RoomSetup';
import { LocationSetup } from '../components/onboarding/LocationSetup';
import { CuisineSwipe } from '../components/onboarding/CuisineSwipe';
import { CompatReveal } from '../components/onboarding/CompatReveal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { savePreferences } from '../api/rooms';
import type { SetLocationParams } from '../api/rooms';
import { isOnboardingComplete, setOnboardingComplete } from '../utils/storage';
import './OnboardingPage.css';

type Step = 'location' | 'prices' | 'cuisines' | 'compat' | 'saving';

export function OnboardingPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { roomCode, room, isSolo, updateLocation, loadRoom } = useRoomContext();
  const jumpToStep = (routerLocation.state as { step?: Step } | null)?.step;
  const [step, setStep] = useState<Step>(jumpToStep ?? 'location');
  const [priceLevels, setPriceLevels] = useState<number[]>([]);
  const [cuisinesLiked, setCuisinesLiked] = useState<string[]>([]);
  const [cuisinesDisliked, setCuisinesDisliked] = useState<string[]>([]);
  const [autoSkipped, setAutoSkipped] = useState(false);

  // Partner 2 joins a room that already has a location — skip that step.
  // Render-phase state adjustment (guarded) per React's derived-state pattern.
  if (!autoSkipped && step === 'location' && room?.location && !jumpToStep) {
    setAutoSkipped(true);
    setStep('prices');
  }

  // If onboarding already done, go straight to the deck
  if (isOnboardingComplete() && !jumpToStep) {
    return (
      <div className="onboarding">
        <h2 className="onboarding__title">Ready to Swipe</h2>
        <p className="onboarding__subtitle">Your tastes are saved — let's find dinner</p>
        <div className="onboarding__spacer" />
        <Button onClick={() => navigate('/swipe')} fullWidth size="lg">
          Find Restaurants
        </Button>
      </div>
    );
  }

  const handleLocationSubmit = async (params: SetLocationParams) => {
    await updateLocation(params);
    setStep('prices');
  };

  const handlePricesComplete = (selected: number[]) => {
    setPriceLevels(selected);
    setStep('cuisines');
  };

  const handleCuisinesComplete = (liked: string[], disliked: string[]) => {
    setCuisinesLiked(liked);
    setCuisinesDisliked(disliked);
    if (isSolo) {
      // Solo mode: skip compat reveal, go straight to saving
      handleSavePreferences(liked, disliked);
    } else {
      setStep('compat');
    }
  };

  const handleSavePreferences = async (
    likedOverride?: string[],
    dislikedOverride?: string[],
  ) => {
    if (!roomCode) return;
    setStep('saving');
    try {
      await savePreferences(roomCode, {
        cuisines_liked: likedOverride ?? cuisinesLiked,
        cuisines_disliked: dislikedOverride ?? cuisinesDisliked,
        price_levels: priceLevels,
      });
      setOnboardingComplete(true);
      await loadRoom(); // pick up saved price levels on the room
      navigate('/swipe');
    } catch {
      setStep('cuisines');
    }
  };

  const handleCompatComplete = async () => {
    await handleSavePreferences();
  };

  return (
    <div className="onboarding">
      {step === 'location' && (
        <LocationSetup onSubmit={handleLocationSubmit} />
      )}

      {step === 'prices' && (
        <RoomSetup onComplete={handlePricesComplete} />
      )}

      {step === 'cuisines' && (
        <CuisineSwipe onComplete={handleCuisinesComplete} />
      )}

      {step === 'compat' && (
        <CompatReveal
          cuisinesLiked={cuisinesLiked}
          onComplete={handleCompatComplete}
        />
      )}

      {step === 'saving' && (
        <div className="onboarding__saving">
          <Spinner size="lg" />
          <p>Saving your tastes...</p>
        </div>
      )}
    </div>
  );
}
