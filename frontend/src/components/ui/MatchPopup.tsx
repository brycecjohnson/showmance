import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { TMDB_IMAGE_BASE } from '../../utils/constants';
import './MatchPopup.css';

interface MatchPopupProps {
  isOpen: boolean;
  title: string;
  posterPath: string | null;
  onClose: () => void;
}

export function MatchPopup({ isOpen, title, posterPath, onClose }: MatchPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="match-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="match-popup"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="match-popup__title">It's a Match!</h2>
            {posterPath && (
              <img
                className="match-popup__poster"
                src={`${TMDB_IMAGE_BASE}/w342${posterPath}`}
                alt={title}
              />
            )}
            <p className="match-popup__name">{title}</p>
            <p className="match-popup__subtitle">You both swiped right</p>
            <Button onClick={onClose} fullWidth>
              Keep Swiping
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
