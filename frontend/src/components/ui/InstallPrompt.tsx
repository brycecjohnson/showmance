import { useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../../utils/constants';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SHOW_DELAY_MS = 30_000;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(STORAGE_KEYS.INSTALL_DISMISSED) === 'true') return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Show the banner after a 30s delay once the prompt event is captured
  useEffect(() => {
    if (!deferredPrompt) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [deferredPrompt]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    // Mark as dismissed either way so we don't show again
    localStorage.setItem(STORAGE_KEYS.INSTALL_DISMISSED, 'true');
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.INSTALL_DISMISSED, 'true');
    setVisible(false);
    setDeferredPrompt(null);
  }, []);

  if (!visible) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt__text">
        Install Showmance for the best experience
      </div>
      <div className="install-prompt__actions">
        <button
          className="install-prompt__btn install-prompt__btn--dismiss"
          onClick={handleDismiss}
          type="button"
        >
          Not now
        </button>
        <button
          className="install-prompt__btn install-prompt__btn--install"
          onClick={handleInstall}
          type="button"
        >
          Install
        </button>
      </div>
    </div>
  );
}
