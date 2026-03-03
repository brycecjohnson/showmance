import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useCards } from '../hooks/useCards';
import { RoomProvider } from '../context/RoomContext';
import { ModeProvider } from '../context/ModeContext';
import type { Card } from '../types/card';

// ── Mocks ────────────────────────────────────────────────────

vi.mock('../api/cards', () => ({
  getCards: vi.fn(),
}));

vi.mock('../api/rooms', () => ({
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  getRoom: vi.fn().mockResolvedValue({
    room_code: 'SHOW-TEST',
    created_at: new Date().toISOString(),
    partner_1_id: 'p1',
    partner_2_id: null,
    streaming_services: [],
    onboarding_complete: false,
  }),
}));

vi.mock('../utils/storage', () => ({
  getRoomCode: () => 'SHOW-TEST',
  getPartnerId: () => 'partner-1',
  getMode: () => 'movie',
  setRoomCode: vi.fn(),
  setPartnerId: vi.fn(),
  setMode: vi.fn(),
  setOnboardingComplete: vi.fn(),
  clearSession: vi.fn(),
}));

import { getCards } from '../api/cards';
const mockGetCards = vi.mocked(getCards);

function makeCard(id: number, type: 'movie' | 'tv' = 'movie'): Card {
  return {
    tmdb_id: id,
    media_type: type,
    title: `Title ${id}`,
    poster_path: `/poster_${id}.jpg`,
    backdrop_path: null,
    overview: 'Overview',
    release_year: 2020,
    rating: 8.0,
    genre_ids: [18],
    genre_names: ['Drama'],
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(RoomProvider, null, createElement(ModeProvider, null, children));
}

// ── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Default: return empty so prefetch effects don't cause unexpected behavior
  mockGetCards.mockResolvedValue({ cards: [], has_more: false });
});

describe('useCards', () => {
  it('fetches cards on mount via fetchCards', async () => {
    // Return enough cards (> prefetch threshold of 5) to avoid triggering prefetch
    const cards = Array.from({ length: 8 }, (_, i) => makeCard(i + 1));
    mockGetCards.mockResolvedValueOnce({ cards, has_more: true });

    const { result } = renderHook(() => useCards(), { wrapper });

    await act(async () => {
      await result.current.fetchCards();
    });

    await waitFor(() => {
      expect(result.current.cards).toHaveLength(8);
    });
    expect(result.current.cards[0].tmdb_id).toBe(1);
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

    const ids = result.current.cards.map((c) => c.tmdb_id);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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
    expect(result.current.cards[0].tmdb_id).toBe(20);
  });
});
