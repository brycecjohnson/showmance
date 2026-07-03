/**
 * Tests for the mock API implementation (frontend/src/api/mock.ts).
 *
 * Because the mock module stores state in module-level Sets/Maps, we
 * re-import a fresh copy of the module before every test via
 * vi.resetModules() + dynamic import().
 *
 * We use fake timers so the mock delay() resolves instantly.
 */

const FIXED_UUID = '00000000-1111-2222-3333-444444444444';

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  vi.stubGlobal('crypto', { randomUUID: () => FIXED_UUID });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function loadMock() {
  const mod = await import('../api/mock');
  return mod.mock;
}

/** Call a mock method and advance timers so its internal setTimeout resolves. */
async function resolved<T>(promise: Promise<T>): Promise<T> {
  vi.advanceTimersByTime(1000);
  return promise;
}

// ─── createRoom ──────────────────────────────────────────────

describe('mock.createRoom', () => {
  it('returns an EATS-prefixed room code and a partner id', async () => {
    const mock = await loadMock();
    const { room_code, partner_id } = await resolved(mock.createRoom());

    expect(room_code).toMatch(/^EATS-[A-Z2-9]{4}$/);
    expect(partner_id).toBe(FIXED_UUID);
  });
});

// ─── getCards ────────────────────────────────────────────────

describe('mock.getCards', () => {
  it('returns restaurant cards with required fields', async () => {
    const mock = await loadMock();
    const { cards } = await resolved(mock.getCards('EATS-TEST'));

    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.place_id).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(card.cuisines.length).toBeGreaterThan(0);
      expect(card.rating).toBeGreaterThan(0);
    }
  });

  it('excludes previously swiped cards', async () => {
    const mock = await loadMock();

    const { cards: before } = await resolved(mock.getCards('EATS-TEST'));
    const firstCard = before[0];

    await resolved(
      mock.recordSwipe({
        place_id: firstCard.place_id,
        direction: 'left',
      }),
    );

    const { cards: after } = await resolved(mock.getCards('EATS-TEST'));
    expect(after.find((c) => c.place_id === firstCard.place_id)).toBeUndefined();
  });

  it('returns has_more=false when all cards are swiped', async () => {
    const mock = await loadMock();

    const { cards: all } = await resolved(mock.getCards('EATS-TEST'));
    for (const card of all) {
      await resolved(
        mock.recordSwipe({
          place_id: card.place_id,
          direction: 'left',
        }),
      );
    }

    const { cards, has_more } = await resolved(mock.getCards('EATS-TEST'));
    expect(cards).toHaveLength(0);
    expect(has_more).toBe(false);
  });
});

// ─── recordSwipe ─────────────────────────────────────────────

describe('mock.recordSwipe', () => {
  it('tracks swiped IDs so they do not appear in subsequent getCards calls', async () => {
    const mock = await loadMock();

    const { cards: before } = await resolved(mock.getCards('EATS-TEST'));
    const target = before[0];

    await resolved(
      mock.recordSwipe({
        place_id: target.place_id,
        direction: 'right',
      }),
    );

    const { cards: after } = await resolved(mock.getCards('EATS-TEST'));
    expect(after.find((c) => c.place_id === target.place_id)).toBeUndefined();
  });

  it('never returns a match on left swipes', async () => {
    const mock = await loadMock();

    const { cards } = await resolved(mock.getCards('EATS-TEST'));
    for (const card of cards) {
      const result = await resolved(
        mock.recordSwipe({
          place_id: card.place_id,
          direction: 'left',
        }),
      );
      expect(result.matched).toBe(false);
      expect(result.match).toBeUndefined();
    }
  });

  it('may return a match on right swipes', async () => {
    const mock = await loadMock();

    // Seed Math.random to force a match (< 0.3 threshold)
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const { cards } = await resolved(mock.getCards('EATS-TEST'));
    const result = await resolved(
      mock.recordSwipe({
        place_id: cards[0].place_id,
        direction: 'right',
      }),
    );

    expect(result.matched).toBe(true);
    expect(result.match).toBeDefined();
    expect(result.match!.place_id).toBe(cards[0].place_id);
  });
});

// ─── getMatches ──────────────────────────────────────────────

describe('mock.getMatches', () => {
  it('seeds matches so the list is not empty', async () => {
    const mock = await loadMock();

    const { matches } = await resolved(mock.getMatches('EATS-TEST'));
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(match.place_id).toBeTruthy();
      expect(match.visited).toBe(false);
    }
  });
});

// ─── updateMatch ─────────────────────────────────────────────

describe('mock.updateMatch', () => {
  it('toggles visited state on a match', async () => {
    const mock = await loadMock();

    const { matches } = await resolved(mock.getMatches('EATS-TEST'));
    const target = matches[0];

    expect(target.visited).toBe(false);

    await resolved(mock.updateMatch('EATS-TEST', target.place_id, { visited: true }));
    const { matches: after } = await resolved(mock.getMatches('EATS-TEST'));
    const updated = after.find((m) => m.place_id === target.place_id)!;
    expect(updated.visited).toBe(true);

    await resolved(mock.updateMatch('EATS-TEST', target.place_id, { visited: false }));
    const { matches: afterOff } = await resolved(mock.getMatches('EATS-TEST'));
    const toggled = afterOff.find((m) => m.place_id === target.place_id)!;
    expect(toggled.visited).toBe(false);
  });
});

// ─── setRoomLocation ─────────────────────────────────────────

describe('mock.setRoomLocation', () => {
  it('stores a GPS location and radius on the room', async () => {
    const mock = await loadMock();

    const before = await resolved(mock.getRoom('EATS-TEST'));
    expect(before.location).toBeNull();

    await resolved(
      mock.setRoomLocation('EATS-TEST', { lat: 30.3, lng: -97.75, radius_m: 4828 }),
    );

    const after = await resolved(mock.getRoom('EATS-TEST'));
    expect(after.location).toEqual({ lat: 30.3, lng: -97.75, label: 'Current location' });
    expect(after.radius_m).toBe(4828);
  });

  it('labels an address location with the address text', async () => {
    const mock = await loadMock();

    const { location } = await resolved(
      mock.setRoomLocation('EATS-TEST', { address: 'South Congress, Austin', radius_m: 8047 }),
    );
    expect(location.label).toBe('South Congress, Austin');
  });

  it('changes card distances when the room location moves', async () => {
    const mock = await loadMock();

    const { cards: before } = await resolved(mock.getCards('EATS-TEST'));
    const target = before.find((c) => c.place_id === 'mock-terra-rossa')!;

    // Move the room ~5.7mi north (Seoul Garden's coords)
    await resolved(
      mock.setRoomLocation('EATS-TEST', { lat: 30.3448, lng: -97.7195, radius_m: 8047 }),
    );

    const { cards: after } = await resolved(mock.getCards('EATS-TEST'));
    const moved = after.find((c) => c.place_id === 'mock-terra-rossa')!;
    expect(moved.distance_mi!).toBeGreaterThan(target.distance_mi!);
  });
});

// ─── getTonightsPick ─────────────────────────────────────────

describe('mock.getTonightsPick', () => {
  it('returns an unvisited match', async () => {
    const mock = await loadMock();

    const { matches } = await resolved(mock.getMatches('EATS-TEST'));
    const { match: pick } = await resolved(mock.getTonightsPick('EATS-TEST'));

    expect(pick).toBeDefined();
    expect(matches.some((m) => m.place_id === pick.place_id)).toBe(true);
    expect(pick.visited).toBe(false);
  });
});
