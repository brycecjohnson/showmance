import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useCards } from '../hooks/useCards';
import { RoomProvider } from '../context/RoomContext';
import type { RestaurantCard } from '../types/card';

// ── Mocks ────────────────────────────────────────────────────

vi.mock('../api/cards', () => ({
  getCards: vi.fn(),
}));

vi.mock('../api/rooms', () => ({
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  getRoom: vi.fn().mockResolvedValue({
    room_code: 'EATS-TEST',
    created_at: new Date().toISOString(),
    partner_number: 1,
    other_partner_joined: false,
    onboarding_complete: false,
    is_solo: false,
    location: { lat: 30.2672, lng: -97.7431, label: 'Austin, TX' },
    radius_m: 8047,
    price_levels: [1, 2],
  }),
}));

vi.mock('../utils/storage', () => ({
  getRoomCode: () => 'EATS-TEST',
  getPartnerId: () => 'partner-1',
  setRoomCode: vi.fn(),
  setPartnerId: vi.fn(),
  setOnboardingComplete: vi.fn(),
  clearSession: vi.fn(),
}));

import { getCards } from '../api/cards';
const mockGetCards = vi.mocked(getCards);

function makeCard(id: number): RestaurantCard {
  return {
    place_id: `place-${id}`,
    name: `Restaurant ${id}`,
    photo_url: `https://images.example.com/photo_${id}.jpg`,
    cuisines: ['Italian'],
    rating: 4.5,
    rating_count: 100,
    price_level: 2,
    address: '123 Main St',
    distance_mi: 1.2,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(RoomProvider, null, children);
}

// ── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Default: return empty so prefetch effects don't cause unexpected behavior
  mockGetCards.mockResolvedValue({ cards: [], has_more: false });
});

describe('useCards', () => {
  it('fetches cards on mount via fetchCards', async () => {
    // 8 cards keeps us above the prefetch threshold
    const cards = Array.from({ length: 8 }, (_, i) => makeCard(i + 1));
    mockGetCards.mockResolvedValueOnce({ cards, has_more: true });

    const { result } = renderHook(() => useCards(), { wrapper });

    await act(async () => {
      await result.current.fetchCards();
    });

    await waitFor(() => {
      expect(result.current.cards).toHaveLength(8);
    });
    expect(result.current.cards[0].place_id).toBe('place-1');
    expect(result.current.hasMore).toBe(true);
  });

  it('deduplicates cards when appending', async () => {
    // First batch: 8 cards (above prefetch threshold)
    const batch1 = Array.from({ length: 8 }, (_, i) => makeCard(i + 1));
    // Second batch overlaps with cards 7,8 and adds 9,10
    const batch2 = [makeCard(7), makeCard(8), makeCard(9), makeCard(10)];

    mockGetCards
      .mockResolvedValueOnce({ cards: batch1, has_more: true })
      .mockResolvedValueOnce({ cards: batch2, has_more: false });

    const { result } = renderHook(() => useCards(), { wrapper });

    await act(async () => {
      await result.current.fetchCards();
    });

    await waitFor(() => {
      expect(result.current.cards).toHaveLength(8);
    });

    await act(async () => {
      await result.current.fetchCards();
    });

    await waitFor(() => {
      // 8 original + 2 new (9, 10) = 10, not 12
      expect(result.current.cards).toHaveLength(10);
    });

    const ids = result.current.cards.map((c) => c.place_id);
    expect(ids).toEqual([
      'place-1', 'place-2', 'place-3', 'place-4', 'place-5',
      'place-6', 'place-7', 'place-8', 'place-9', 'place-10',
    ]);
  });

  it('removeTopCard removes the first card', async () => {
    const cards = Array.from({ length: 8 }, (_, i) => makeCard((i + 1) * 10));
    mockGetCards.mockResolvedValueOnce({ cards, has_more: false });

    const { result } = renderHook(() => useCards(), { wrapper });

    await act(async () => {
      await result.current.fetchCards();
    });

    await waitFor(() => {
      expect(result.current.cards).toHaveLength(8);
    });

    act(() => {
      result.current.removeTopCard();
    });

    expect(result.current.cards).toHaveLength(7);
    expect(result.current.cards[0].place_id).toBe('place-20');
  });
});
