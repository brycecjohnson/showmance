import { useState, useCallback } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import './RoomCodeChip.css';

export function RoomCodeChip() {
  const { roomCode, isSolo } = useRoomContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: silently fail
    }
  }, [roomCode]);

  const handleShare = useCallback(async () => {
    if (!roomCode) return;
    const shareData = {
      title: 'Showmance',
      text: `Join my Showmance room: ${roomCode}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // User cancelled share dialog
    }
  }, [roomCode]);

  if (!roomCode) return null;

  return (
    <div className="room-code-chip">
      <span
        className="room-code-chip__code"
        onClick={handleCopy}
        role="button"
        tabIndex={0}
        aria-label={`Room code: ${roomCode}. Tap to copy.`}
      >
        {copied ? 'Copied!' : roomCode}
      </span>
      {!isSolo && (
        <button
          className="room-code-chip__share"
          onClick={handleShare}
          type="button"
          aria-label="Share room code"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
