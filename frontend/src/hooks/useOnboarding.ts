import { useState, useCallback } from 'react';
import { savePreferences } from '../api/rooms';
import { useRoomContext } from '../context/RoomContext';
import * as storage from '../utils/storage';

export type OnboardingStep = 'mode' | 'genres' | 'eras' | 'complete';

const STEP_ORDER: OnboardingStep[] = ['mode', 'genres', 'eras', 'complete'];

export function useOnboarding() {
  const { roomCode } = useRoomContext();
  const [step, setStep] = useState<OnboardingStep>('mode');
  const [genresLiked, setGenresLiked] = useState<string[]>([]);
  const [genresDisliked, setGenresDisliked] = useState<string[]>([]);
  const [selectedEras, setSelectedEras] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const nextStep = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      setStep(STEP_ORDER[idx - 1]);
    }
  }, [step]);

  const likeGenre = useCallback((genre: string) => {
    setGenresLiked((prev) => [...prev, genre]);
  }, []);

  const dislikeGenre = useCallback((genre: string) => {
    setGenresDisliked((prev) => [...prev, genre]);
  }, []);

  const toggleEra = useCallback((era: string) => {
    setSelectedEras((prev) =>
      prev.includes(era) ? prev.filter((e) => e !== era) : [...prev, era],
    );
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!roomCode) return;
    setIsSaving(true);
    try {
      await savePreferences(roomCode, {
        genres_liked: genresLiked,
        genres_disliked: genresDisliked,
        eras: selectedEras,
        streaming_services: [],
      });
      storage.setOnboardingComplete(true);
      setStep('complete');
    } finally {
      setIsSaving(false);
    }
  }, [roomCode, genresLiked, genresDisliked, selectedEras]);

  return {
    step,
    genresLiked,
    genresDisliked,
    selectedEras,
    isSaving,
    nextStep,
    prevStep,
    likeGenre,
    dislikeGenre,
    toggleEra,
    completeOnboarding,
  };
}
