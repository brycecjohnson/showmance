import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import './CompatReveal.css';

interface CompatRevealProps {
  genresLiked: string[];
  seedLiked: number[];
  onComplete: () => void;
}

function computeScore(genresLiked: string[], seedLiked: number[]): number {
  const genreWeight = Math.min(genresLiked.length * 5, 50);
  const seedWeight = Math.min(seedLiked.length * 4, 40);
  const base = 10;
  return Math.min(genreWeight + seedWeight + base, 99);
}

export function CompatReveal({ genresLiked, seedLiked, onComplete }: CompatRevealProps) {
  const score = computeScore(genresLiked, seedLiked);
  const [displayScore, setDisplayScore] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!revealed) return;
    let current = 0;
    const step = Math.max(1, Math.floor(score / 30));
    const interval = setInterval(() => {
      current += step;
      if (current >= score) {
        current = score;
        clearInterval(interval);
      }
      setDisplayScore(current);
    }, 40);
    return () => clearInterval(interval);
  }, [revealed, score]);

  return (
    <div className="compat-reveal">
      <motion.div
        className="compat-reveal__card"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      >
        <motion.div
          className="compat-reveal__score-ring"
          initial={{ rotate: -90 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        >
          <svg className="compat-reveal__ring-svg" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--color-surface)"
              strokeWidth="8"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              animate={{
                strokeDashoffset: revealed
                  ? 2 * Math.PI * 52 * (1 - score / 100)
                  : 2 * Math.PI * 52,
              }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
              style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
            />
          </svg>
          <span className="compat-reveal__score-number">
            {displayScore}%
          </span>
        </motion.div>

        <motion.h2
          className="compat-reveal__title"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          {score >= 70
            ? "You're a great match!"
            : score >= 40
              ? 'Solid foundation!'
              : "Let's explore together!"}
        </motion.h2>

        <motion.p
          className="compat-reveal__subtitle"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          You're a {score}% match — let's find your next watch!
        </motion.p>

        {genresLiked.length > 0 && (
          <motion.div
            className="compat-reveal__genres"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            <p className="compat-reveal__genres-label">Your top genres</p>
            <div className="compat-reveal__genre-tags">
              {genresLiked.slice(0, 5).map((genre) => (
                <span key={genre} className="compat-reveal__genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          className="compat-reveal__action"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <Button onClick={onComplete} fullWidth size="lg">
            Start Swiping
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
