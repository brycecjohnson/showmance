import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RoomProvider } from './context/RoomContext';
import { ModeProvider } from './context/ModeContext';
import { AppShell } from './components/layout/AppShell';
import { BottomNav } from './components/layout/BottomNav';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SwipePage } from './pages/SwipePage';
import { MatchesPage } from './pages/MatchesPage';
import { ProtectedRoute } from './components/room/ProtectedRoute';
import { InstallPrompt } from './components/ui/InstallPrompt';
import { UpdateToast } from './components/ui/UpdateToast';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import './App.css';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = { duration: 0.15 };

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ display: 'contents' }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/swipe"
            element={
              <ProtectedRoute>
                <SwipePage />
                <BottomNav />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <MatchesPage />
                <BottomNav />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();

  return (
    <BrowserRouter>
      <RoomProvider>
        <ModeProvider>
          <AppShell>
            <OfflineBanner />
            <AnimatedRoutes />
            <InstallPrompt />
            {updateAvailable && <UpdateToast onRefresh={applyUpdate} />}
          </AppShell>
        </ModeProvider>
      </RoomProvider>
    </BrowserRouter>
  );
}

export default App;
