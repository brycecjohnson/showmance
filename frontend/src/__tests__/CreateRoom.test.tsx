import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, type ReactNode } from 'react';
import { CreateRoom } from '../components/room/CreateRoom';
import { RoomProvider } from '../context/RoomContext';

// Mock rooms API — createRoom rejects to simulate an error
vi.mock('../api/rooms', () => ({
  createRoom: vi.fn().mockRejectedValue(new Error('Network error')),
  joinRoom: vi.fn(),
  getRoom: vi.fn().mockRejectedValue(new Error('No room')),
}));

// Mock storage — no room code stored (simulates error path: createRoom failed)
vi.mock('../utils/storage', () => ({
  getRoomCode: () => null,
  getPartnerId: () => null,
  setRoomCode: vi.fn(),
  setPartnerId: vi.fn(),
  getMode: () => 'movie',
  setMode: vi.fn(),
  clearSession: vi.fn(),
  setOnboardingComplete: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return createElement(RoomProvider, null, children);
}

describe('CreateRoom', () => {
  it('does not call onCreated when room creation fails', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();

    render(<CreateRoom onCreated={onCreated} />, { wrapper });

    const button = screen.getByRole('button', { name: /create a room/i });
    await user.click(button);

    // Wait for error message to appear (the Error.message from the rejected promise)
    const errorEl = await screen.findByText(/network error/i);
    expect(errorEl).toBeInTheDocument();

    // onCreated should NOT have been called because creation failed
    expect(onCreated).not.toHaveBeenCalled();
  });
});
