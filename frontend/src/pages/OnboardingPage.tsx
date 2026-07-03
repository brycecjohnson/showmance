import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext } from '../context/RoomContext';
import { RoomSetup } from '../components/room/RoomSetup';
import { CuisineSwipe } from '../components/onboarding/CuisineSwipe';
import { CompatReveal } from '../components/onboarding/CompatReveal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { savePreferences } from '../api/rooms';
import { isOnboardingComplete, setOnboardingComplete } from '../utils/storage';
import './OnboardingPage.css';

type Step = 'prices' | 'cuisines' | 'compat' | 'saving';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { roomCode, isSolo } = useRoomContext();
  const [step, setStep] = useState<Step>('prices');
  const [priceLevels, setPriceLevels] = useState<number[]>([]);
  const [cuisinesLiked, setCuisinesLiked] = useState<string[]>([]);
  const [cuisinesDisliked, setCuisinesDisliked] = useState<string[]>([]);

  // If onboarding already done, go straight to the deck
  if (isOnboardingComplete()) {
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
