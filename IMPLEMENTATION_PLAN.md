# Showmance Implementation Plan

## Context

Showmance is a couples movie/show matching PWA — Tinder-style swiping on movies and TV shows, powered by TMDB. Both partners swipe independently and matches appear in a shared list. The project is greenfield (no code exists). This plan covers the full MVP (Phases 1-4).

**Decisions made:** React + Vite frontend, Python Lambda backend, DynamoDB single-table, on-next-open match notifications (no WebSocket).

---

## Project Structure

```
showmance/
├── frontend/                       # React + Vite + TypeScript PWA
│   ├── public/                     # manifest.json, sw.js, icons, offline.html
│   └── src/
│       ├── api/                    # Fetch wrappers (rooms, swipes, matches, cards)
│       ├── components/
│       │   ├── cards/              # SwipeCard, CardStack, CardDetail, GenreCard
│       │   ├── layout/             # AppShell, BottomNav, ModeToggle
│       │   ├── matches/            # MatchList, MatchItem, MatchFilters, TonightsPick
│       │   ├── onboarding/         # GenreSwipe, EraSelect, SeedSwipe, CompatReveal
│       │   ├── room/               # CreateRoom, JoinRoom, RoomSetup
│       │   └── ui/                 # Button, Badge, Spinner, Toast, MatchPopup
│       ├── hooks/                  # useRoom, useSwipe, useCards, useMatches, useOnboarding
│       ├── context/                # RoomContext, ModeContext
│       ├── pages/                  # LandingPage, OnboardingPage, SwipePage, MatchesPage
│       ├── types/                  # room.ts, card.ts, swipe.ts, match.ts
│       └── utils/                  # storage.ts, roomCode.ts, constants.ts
│
├── backend/                        # AWS SAM + Python
│   ├── template.yaml               # All AWS infra (DynamoDB, Lambdas, API Gateway)
│   ├── layers/shared/python/shared/ # Shared utilities
│   │   ├── dynamo.py               # DynamoDB client + helpers
│   │   ├── tmdb.py                 # TMDB client with DynamoDB caching
│   │   ├── response.py             # Standardized API responses + CORS
│   │   └── validation.py           # Input validation
│   └── functions/                  # One directory per Lambda
│       ├── create_room/            # POST /rooms
│       ├── join_room/              # POST /rooms/{code}/join
│       ├── get_room/               # GET /rooms/{code}
│       ├── save_preferences/       # POST /rooms/{code}/preferences
│       ├── get_cards/              # GET /cards/{code} — content pipeline
│       ├── record_swipe/           # POST /swipe — records + detects matches
│       ├── get_matches/            # GET /matches/{code}
│       ├── update_match/           # PATCH /matches/{code}/{tmdb_id}
│       ├── tonights_pick/          # GET /tonight/{code}
│       └── cache_warmer/           # Scheduled daily — pre-warms TMDB cache
│
└── deploy/
    ├── deploy-frontend.sh          # Build + S3 sync + CloudFront invalidation
    └── deploy-backend.sh           # SAM build + deploy
```

---

## Key Architecture Decisions

### DynamoDB: Single-Table Design

One table (`showmance`) with PK/SK + one GSI. All entities keyed by room code:

| Entity | PK | SK | Purpose |
|--------|----|----|---------|
| Room | `ROOM#SHOW-7X3K` | `METADATA` | Room settings, partner IDs, streaming services |
| Preferences | `ROOM#SHOW-7X3K` | `PREFS#uuid-1` | Genre likes/dislikes, eras, seed swipes per partner |
| Swipe | `ROOM#SHOW-7X3K` | `SWIPE#movie#12345#uuid-1` | Individual swipe record |
| Swiped Set | `ROOM#SHOW-7X3K` | `SWIPED#movie#uuid-1` | Compact set of all swiped TMDB IDs (for exclusion) |
| Match | `ROOM#SHOW-7X3K` | `MATCH#movie#12345` | Matched title with watched state |
| TMDB Cache | `CACHE#discover_movie_28_p1` | `DATA` | Cached TMDB responses with TTL auto-delete |

**GSI1**: `GSI1PK=ROOM#code#MATCHES#movie`, `GSI1SK=matched_at` — for sorted match queries by mode.

### Seen State Solution

A compact `SWIPED#` entity stores all swiped TMDB IDs as a DynamoDB Number Set. Atomic `ADD` on write (no read-modify-write). Single `GetItem` on read in `get_cards` to build the exclusion set. Scales to 40K+ IDs per item.

### TMDB Caching (3-tier)

1. **DynamoDB cache** — TMDB responses cached with 6h-7d TTL depending on content type. TTL auto-deletes expired entries.
2. **Lambda /tmp** — in-memory dict within a single invocation to avoid duplicate TMDB calls.
3. **Scheduled cache warmer** — daily EventBridge Lambda pre-caches trending + popular content by genre.

### Swipe Gestures: Framer Motion (custom)

Custom implementation using `framer-motion` (actively maintained) instead of `react-tinder-card` (stale). Uses `drag="x"`, `useMotionValue`, `useTransform` for rotation/overlay, and `animate()` for fly-off/snap-back. Desktop fallback via arrow keys + buttons.

### Match Detection

When a "right" swipe is recorded, `record_swipe` does a single `GetItem` to check if the other partner also swiped right on the same title. If yes, creates a `MATCH#` entity. Frontend shows "It's a Match!" popup.

### State Management

React Context for two global concerns (`RoomContext`, `ModeContext`). Custom hooks (`useCards`, `useMatches`, `useOnboarding`) for everything else. No Redux/Zustand needed.

---

## Phased Build Plan

### Phase 1: Foundation + Onboarding (Week 1-2)

**Goal**: Two users can create/join a room and complete onboarding. No real content swiping yet.

1. **Scaffold React + Vite project** — `npm create vite@latest frontend -- --template react-ts`. Install `framer-motion`, `react-router-dom`.
2. **PWA shell** — `manifest.json`, basic `sw.js` with offline fallback, register in `main.tsx`.
3. **CSS design system** — Dark theme custom properties: bg `#0f0f14`, surface `#1a1a24`, accent coral `#ff6b4a`, text `#f0f0f0`. Responsive breakpoints.
4. **SAM backend scaffold** — `template.yaml` with DynamoDB table, shared layer, `create_room` + `join_room` Lambdas. Test with `sam local start-api`.
5. **Room create/join flow** — `LandingPage`, `CreateRoom`, `JoinRoom` components. Backend generates `SHOW-XXXX` code. Room code + partner UUID stored in localStorage.
6. **Room setup** — `RoomSetup`: streaming service multi-select. Saves to room entity.
7. **Mode select** — `ModeToggle`: TV/Movie pill toggle.
8. **Genre swipe onboarding** — `GenreSwipe`: 18 genre cards with same swipe mechanic as main deck. Records liked/disliked genres.
9. **Era selection** — `EraSelect`: checkbox/pill selection for eras.
10. **Save preferences Lambda** — Writes `PREFS#` entity with genres, eras.
11. **Deploy to AWS** — S3/CloudFront for frontend, SAM deploy for backend.

### Phase 2: Core Swipe Experience (Week 2-3)

**Goal**: Full swipe deck with real TMDB content, match detection, match popup.

1. **TMDB integration layer** — Build `shared/tmdb.py` with DynamoDB caching. Test discover/trending/recommendations endpoints.
2. **Seed titles swipe** — `SeedSwipe`: ~15 popular titles from TMDB based on genre overlap. Poster imagery cards. Save results to preferences.
3. **Compatibility reveal** — `CompatReveal`: compute genre overlap + shared seed likes. Playful compatibility percentage. Mark onboarding complete.
4. **`get_cards` Lambda (content pipeline)** — Load prefs → query TMDB (cached) → merge/dedupe → filter swiped IDs → filter by streaming services → score/rank → return batch of 20.
5. **SwipeCard + CardStack** — Framer-motion drag gestures, 3 visible cards, rotation, like/nope overlays, fly-off animation.
6. **`record_swipe` Lambda** — Write `SWIPE#` entity, atomic `ADD` to `SWIPED#` set, `GetItem` match check, create `MATCH#` if both right.
7. **Match popup** — `MatchPopup` overlay with poster + "It's a Match!" animation.
8. **New match badge** — Compare `matched_at` vs `last_seen_at` (localStorage). Badge count on Matches tab.
9. **Card prefetching** — Fetch next batch when deck drops below 5 cards.
10. **Desktop fallback** — Arrow keys + like/pass buttons.

### Phase 3: Match Management (Week 3-4)

**Goal**: Match list with filters, sorting, watched state, Tonight's Pick.

1. **`get_matches` Lambda** — Query GSI1 for matches by mode, return sorted.
2. **MatchList + MatchItem** — Scrollable list with poster thumbnails, title, year, rating, genre tags. TV/Movie tab toggle.
3. **Filters + sorting** — Genre/streaming service filter chips. Sort by date matched, rating, release year (client-side).
4. **Mark as watched** — `update_match` Lambda. Swipe-to-dismiss or explicit button.
5. **Tonight's Pick** — `tonights_pick` Lambda returns random unwatched match. Card flip reveal animation + re-roll button.
6. **Empty states** — "No matches yet", "All caught up", "No matches for this filter".
7. **Bottom navigation** — Swipe / Matches tabs with match count badge.

### Phase 4: Polish + PWA (Week 4-5)

**Goal**: Production-ready installable PWA with full detail views and robust error handling.

1. **Card detail view** — Bottom sheet/full page: overview, cast, director, seasons/episodes, trailer link, streaming badges. On-demand TMDB fetch with `append_to_response`.
2. **Streaming filter on cards** — Watch provider filtering in `get_cards`. Service badge on card.
3. **Service worker upgrade** — `vite-plugin-pwa` (Workbox): cache hashed assets, cache TMDB poster images, network-first API calls with offline fallback.
4. **PWA install prompt** — Capture `beforeinstallprompt`, custom install banner.
5. **Loading states** — Skeleton cards, shimmer on match list, optimistic swipe UI.
6. **Error handling** — API error toasts, retry with exponential backoff, graceful TMDB-down fallback.
7. **Responsive polish** — Test iPhone SE → iPad → desktop. Min 44px touch targets.
8. **Cache warmer deploy** — EventBridge daily schedule.
9. **Lighthouse audit** — Target 90+ performance, 100 PWA.
10. **End-to-end test** — Two phones: create room → join → onboard → swipe → match → Tonight's Pick → mark watched.

---

## Verification Plan

1. **Local dev**: `sam local start-api` for backend, `npm run dev` for frontend with proxy to local API
2. **Room flow**: Create room on phone A, join on phone B with code, verify both see room in DynamoDB
3. **Onboarding**: Complete genre/era/seed swipe on both phones, verify PREFS# entities in DynamoDB
4. **Swiping**: Both partners swipe, verify SWIPE# and SWIPED# entities populate correctly
5. **Match detection**: Both swipe right on same title, verify MATCH# entity created and popup appears
6. **Match list**: Browse matches, filter, sort, mark watched, verify DynamoDB updates
7. **Tonight's Pick**: Trigger random pick, verify it selects from unwatched matches only
8. **PWA**: Install on home screen, verify full-screen mode, verify offline fallback page
9. **Lighthouse**: Run audit, confirm 90+ performance and 100 PWA score
