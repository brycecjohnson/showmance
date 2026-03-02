import type { ReactNode } from 'react';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return <div className="app-shell">{children}</div>;
}
