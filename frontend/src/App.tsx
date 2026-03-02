import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoomProvider } from './context/RoomContext';
import { ModeProvider } from './context/ModeContext';
import { AppShell } from './components/layout/AppShell';
import { BottomNav } from './components/layout/BottomNav';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SwipePage } from './pages/SwipePage';
import { MatchesPage } from './pages/MatchesPage';
import { ProtectedRoute } from './components/room/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <RoomProvider>
        <ModeProvider>
          <AppShell>
            <Routes>
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
          </AppShell>
        </ModeProvider>
      </RoomProvider>
    </BrowserRouter>
  );
}

export default App;
