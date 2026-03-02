import { Navigate } from 'react-router-dom';
import { getRoomCode, getPartnerId } from '../../utils/storage';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const roomCode = getRoomCode();
  const partnerId = getPartnerId();

  if (!roomCode || !partnerId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
