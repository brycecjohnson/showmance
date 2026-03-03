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

// ─── getCards ────────────────────────────────────────────────

describe('mock.getCards', () => {
  it('returns only movie cards when mode is "movie"', async () => {
    const mock = await loadMock();
    const { cards } = await resolved(mock.getCards('SHOW-TEST', 'movie'));

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.media_type === 'movie')).toBe(true);
  });

  it('returns only tv cards when mode is "tv"', async () => {
    const mock = await loadMock();
    const { cards } = await resolved(mock.getCards('SHOW-TEST', 'tv'));

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.media_type === 'tv')).toBe(true);
  });

  it('excludes previously swiped cards', async () => {
    const mock = await loadMock();

    const { cards: before } = await resolved(mock.getCards('SHOW-TEST', 'movie'));
    const firstCard = before[0];

    await resolved(
      mock.recordSwipe({
        tmdb_id: firstCard.tmdb_id,
        direction: 'left',
        media_type: firstCard.media_type,
      }),
    );

    const { cards: after } = await resolved(mock.getCards('SHOW-TEST', 'movie'));
    expect(after.find((c) => c.tmdb_id === firstCard.tmdb_id)).toBeUndefined();
  });

  it('returns has_more=false when all cards for the mode are swiped', async () => {
    const mock = await loadMock();

    const { cards: allMovies } = await resolved(mock.getCards('SHOW-TEST', 'movie'));
    for (const card of allMovies) {
      await resolved(
        mock.recordSwipe({
          tmdb_id: card.tmdb_id,
          direction: 'left',
          media_type: card.media_type,
        }),
      );
    }

    const { cards, has_more } = await resolved(mock.getCards('SHOW-TEST', 'movie'));
    expect(cards).toHaveLength(0);
    expect(has_more).toBe(false);
  });
});

// ─── recordSwipe ─────────────────────────────────────────────

describe('mock.recordSwipe', () => {
  it('tracks swiped IDs so they do not appear in subsequent getCards calls', async () => {
    const mock = await loadMock();

    const { cards: before } = await resolved(mock.getCards('SHOW-TEST', 'tv'));
    const target = before[0];

    await resolved(
      mock.recordSwipe({
        tmdb_id: target.tmdb_id,
        direction: 'right',
        media_type: target.media_type,
      }),
    );

    const { cards: after } = await resolved(mock.getCards('SHOW-TEST', 'tv'));
    expect(after.find((c) => c.tmdb_id === target.tmdb_id)).toBeUndefined();
  });

  it('never returns a match on left swipes', async () => {
    const mock = await loadMock();

    const { cards } = await resolved(mock.getCards('SHOW-TEST', 'movie'));
    for (const card of cards) {
      const result = await resolved(
        mock.recordSwipe({
          tmdb_id: card.tmdb_id,
          direction: 'left',
          media_type: card.media_type,
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

    const { cards } = await resolved(mock.getCards('SHOW-TEST', 'movie'));
    const result = await resolved(
      mock.recordSwipe({
        tmdb_id: cards[0].tmdb_id,
        direction: 'right',
        media_type: cards[0].media_type,
      }),
    );

    expect(result.matched).toBe(true);
    expect(result.match).toBeDefined();
    expect(result.match!.tmdb_id).toBe(cards[0].tmdb_id);
  });
});

// ─── getMatches ──────────────────────────────────────────────

describe('mock.getMatches', () => {
  it('returns matches filtered by mode', async () => {
    const mock = await loadMock();

    const { matches: movieMatches } = await resolved(mock.getMatches('SHOW-TEST', 'movie'));
    expect(movieMatches.length).toBeGreaterThan(0);
    expect(movieMatches.every((m) => m.media_type === 'movie')).toBe(true);

    const { matches: tvMatches } = await resolved(mock.getMatches('SHOW-TEST', 'tv'));
    expect(tvMatches.length).toBeGreaterThan(0);
    expect(tvMatches.every((m) => m.media_type === 'tv')).toBe(true);
  });
});

// ─── updateMatch ─────────────────────────────────────────────

describe('mock.updateMatch', () => {
  it('toggles watched state on a match', async () => {
    const mock = await loadMock();

    const { matches } = await resolved(mock.getMatches('SHOW-TEST', 'movie'));
    const target = matches[0];

    expect(target.watched).toBe(false);

    await resolved(mock.updateMatch('SHOW-TEST', target.tmdb_id, { watched: true }));
    const { matches: after } = await resolved(mock.getMatches('SHOW-TEST', 'movie'));
    const updated = after.find((m) => m.tmdb_id === target.tmdb_id)!;
    expect(updated.watched).toBe(true);

    await resolved(mock.updateMatch('SHOW-TEST', target.tmdb_id, { watched: false }));
    const { matches: afterOff } = await resolved(mock.getMatches('SHOW-TEST', 'movie'));
    const toggled = afterOff.find((m) => m.tmdb_id === target.tmdb_id)!;
    expect(toggled.watched).toBe(false);
  });
});
