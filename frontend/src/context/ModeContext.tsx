import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { MediaMode } from '../types/room';
import * as storage from '../utils/storage';

interface ModeContextValue {
  mode: MediaMode;
  setMode: (mode: MediaMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<MediaMode>(storage.getMode);

  const setMode = useCallback((newMode: MediaMode) => {
    storage.setMode(newMode);
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'movie' ? 'tv' : 'movie');
  }, [mode, setMode]);

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useModeContext(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useModeContext must be used within ModeProvider');
  return ctx;
}
