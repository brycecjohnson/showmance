# Forkd 🍴❤️ (working title)

**Tagline:** *Swipe together. Eat together.*

A couples restaurant-matching PWA. You and your partner swipe right or left on
cuisines, then on actual nearby restaurants — and when you both swipe right,
it's a match. No more "I don't know, where do YOU want to eat?"

> **Naming note:** "Forkd" is a placeholder. Other candidates: Chewsy, Plately,
> Table4Two, BiteMatch. Nothing in the design depends on the name; it touches
> the manifest, icons, room-code prefix, and copy only.

This is a **full pivot of the Showmance repo**. The movie/TV product is retired
(git history preserves it); the room system, swipe engine, match pipeline, PWA
shell, and AWS serverless backend are all reused for the restaurant domain.

---

## Part I — The Finished Product

### Vision

A lightweight, fun PWA that solves the nightly "where should we eat?" argument.
Set your location once, teach the app your cuisine tastes with a quick swipe
round, then swipe on real nearby restaurants with photos, ratings, and prices.
Both partners swipe independently; mutual right-swipes land in a shared
"Places to Try" list. Can't pick from the list? Hit **Tonight's Pick**.

Long-term: wrap the same codebase with Capacitor and ship to the Apple App
Store.

### Two-Phase Swiping (the core loop)

**Phase A — Cuisine Round (onboarding, per partner, zero API cost)**
- ~20 curated cuisine cards (Italian 🍝, Mexican 🌮, Thai 🌶️, Sushi 🍣, BBQ,
  Indian, Chinese, Pizza, Burgers, Mediterranean, Korean, Vietnamese, Seafood,
  Breakfast/Brunch, Steakhouse, Ramen/Noodles, Vegetarian-forward, Bakery/Café,
  Wings/Bar food, Dessert…)
- Same swipe mechanic as the main deck (reuses the existing `GenreSwipe`
  pattern 1:1) — cuisine name + emoji + color, no API calls
- Produces per-partner liked/disliked cuisine sets; the overlap drives the
  restaurant deck
- Ends with a **Compatibility Reveal**: "You both crave Thai 🌶️ — 82% food
  compatible!"

**Phase B — Restaurant Round (the main deck)**
- Real nearby restaurants filtered by liked cuisines, price comfort, and radius
- Card: hero photo, name, cuisine tags, ★ rating + review count, price level
  ($–$$$$), distance ("0.8 mi"), open-now badge
- Tap to expand: address, hours, phone, website, photo(s), and a **Google Maps
  deep link** for directions (free, no API cost)
- Swipe right = "I'd eat there", left = pass. Both right → match popup.

### Location

- **GPS**: browser `navigator.geolocation` ("Use my location") — works in PWA
  and later via Capacitor's Geolocation plugin
- **Manual address**: text input geocoded server-side (Google Geocoding API)
  for "we're planning a trip" / desktop / denied-permission cases
- **Radius selector**: 1 / 3 / 5 / 10 miles
- Location + radius live on the **room** (either partner can update it); the
  deck always derives from the room's current location. Changing location
  starts a fresh deck but keeps the match list.
- MVP has **no map UI** — GPS button + address field is enough. A pin-drop map
  (Leaflet + free OSM tiles) is a post-MVP nicety.

### Core Features (MVP)

1. **Room system** (reused as-is) — create a room, get a code like
   `EATS-7X3K`, partner joins with the code. No accounts; partner identity is
   a UUID in localStorage. Solo mode supported (every right-swipe is a match —
   works as a personal shortlist).
2. **Swipe deck** — framer-motion card stack (reused as-is), prefetching,
   desktop arrow-key/button fallback.
3. **Match list — "Places to Try"** — shared list, sorted by match date;
   filter by cuisine / price / open-now; sort by rating, distance, date. Mark
   as **Visited** (replaces "watched") to archive it.
4. **Tonight's Pick** — random unvisited match with the reveal animation +
   re-roll.
5. **Filters** — price levels and radius set at onboarding, editable later
   from settings.
6. **PWA** — installable, offline fallback, match-notification badge on next
   open (no push for MVP).

### Post-MVP / Stretch

- Groups of 3+ ("where do 4 friends eat tonight") — the data model is designed
  for this from day one, see below
- Dietary filters (vegetarian/vegan/gluten-free) — Places data for this is
  weak, so it ships as a soft filter later
- Pin-drop map for location, "open late" quick filter, super-like ("I'm
  craving this NOW"), stats ("You've matched 23 spots"), share-to-Messages
- Push notifications for matches

### Screens

1. **Landing** — create / join room
2. **Room Created** — share code
3. **Location Setup** — GPS button, address field, radius pills
4. **Taste Setup** — price-comfort multi-select ($–$$$$)
5. **Cuisine Swipe** — per-partner onboarding round
6. **Compatibility Reveal** — cuisine overlap, fun score
7. **Swipe Screen** — restaurant card stack + match popup
8. **Card Detail** — expanded restaurant info + directions link
9. **Places to Try** — match list, filters, Visited toggle, Tonight's Pick
10. **Tonight's Pick** — reveal animation
11. **Settings** — edit location/radius/price, redo cuisine round, leave room

Design system is unchanged: dark theme (`#0f0f14` bg, `#1a1a24` surface,
coral `#ff6b4a` accent — works even better for food than for movies), bold
imagery, minimal chrome, 44px touch targets, mobile-first.

---

## Part II — Data & Architecture

### Restaurant Data: Google Places API (New)

**Decision:** Google Places, fronted by the same DynamoDB caching pattern the
repo already uses for TMDB. Best-in-class coverage, photos, ratings, price
levels, hours. (Yelp Fusion is now paid-only; Foursquare's free tier collapsed
to 500 calls/mo in June 2026; OpenStreetMap is free but cards would be sparse —
no ratings/photos/prices for most places.)

**Endpoints used:**

| Endpoint | Use | Notes |
|----------|-----|-------|
| `places:searchNearby` | Build the deck | `includedTypes` mapped from liked cuisines (Places has per-cuisine types: `italian_restaurant`, `thai_restaurant`, …), `maxResultCount: 20`, location + radius |
| Place Details | Card detail view (hours, phone, website) | Lazy — only when a card is expanded |
| Place Photos | Hero image per card | Resolve `photoUri` once, cache it |
| Geocoding API | Manual address → lat/lng | One call per address entry |

**Field masks are the cost lever.** Every request declares exactly which
fields it wants; the requested fields determine the billing SKU tier
(Essentials/Pro/Enterprise — each with its own free monthly cap: 10K/5K/1K as
of the March 2025 pricing model). Deck requests use the leanest mask that
covers the card (id, displayName, types, location, rating, userRatingCount,
priceLevel, photos); detail-view fields are fetched only on demand. Exact
field→SKU mapping gets verified against current docs in Stage 3.

**Caching (reuses the 3-tier TMDB pattern in `shared/tmdb.py`):**
- Nearby results cached in DynamoDB under `CACHE#nearby#{geohash5}#{cuisine}#{price}#{radius}`
  with ~24h TTL — a couple swiping in the same neighborhood all week hits
  Google once per cuisine per day
- Location is bucketed to a ~5-char geohash (~2.4 km cells) so tiny GPS jitter
  doesn't bust the cache
- Place Details and photo URIs cached per `CACHE#place#{place_id}` with TTL
- **ToS guardrails:** `place_id` may be stored indefinitely; other place data
  caches max out at 30 days. Match records therefore store `place_id`
  permanently plus a display **snapshot** (`name`, `photo_uri`, `rating`, …)
  with a `snapshot_at`; snapshots older than 30 days are lazily refreshed
  from the (cached) Details call when the match list loads.

**Cost model:** a couple doing a few deck-loads a week ≈ low hundreds of
Google calls/month after caching — inside the free caps. Setup includes a GCP
budget alert at $5 as a tripwire. AWS side is unchanged (<$1/mo).

### DynamoDB Schema (single table, updated)

Same table, same PK/SK + GSI1 shape. The old `{media_type}` slot in sort keys
becomes the **domain** slot (`cuisine` | `restaurant`), so the existing
two-level key layout carries the two-phase swipe model with no structural
change:

| Entity | PK | SK | Notes |
|--------|----|----|-------|
| Room | `ROOM#{code}` | `METADATA` | + `location {lat, lng, label}`, `radius_m`, `price_levels`, `members` (see below) |
| Preferences | `ROOM#{code}` | `PREFS#{member_id}` | `cuisines_liked`, `cuisines_disliked` (replaces genres/eras/seeds) |
| Swipe | `ROOM#{code}` | `SWIPE#restaurant#{place_id}#{member_id}` | direction, denormalized name |
| Swiped Set | `ROOM#{code}` | `SWIPED#restaurant#{member_id}` | String Set of place_ids (atomic ADD, exclusion on deck build) |
| Match | `ROOM#{code}` | `MATCH#restaurant#{place_id}` | snapshot fields + `snapshot_at`, `visited`, `visited_at` |
| Cache | `CACHE#{cache_key}` | `DATA` | TTL auto-delete, same as today |

GSI1 unchanged in shape: `GSI1PK=ROOM#{code}#MATCHES#restaurant`,
`GSI1SK=matched_at`.

**Group-ready room model:** `partner_1_id`/`partner_2_id` are replaced by a
`members` map (`member_id → {joined_at}`) with `max_members` (2 for MVP).
Match detection generalizes from "did the other partner right-swipe?" to
"count right-swipes for this place == member count" — a cheap
`Query begins_with(SWIPE#restaurant#{place_id}#)` on each right-swipe. Adding
groups later is a config change (`max_members`), not a migration.

### API Endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/rooms` | reused (new code prefix `EATS-`) |
| POST | `/rooms/{code}/join` | reused (members model) |
| GET | `/rooms/{code}` | reused |
| PUT | `/rooms/{code}/location` | **new** — set lat/lng or address (server geocodes), radius |
| POST | `/rooms/{code}/preferences` | payload becomes cuisines + price levels |
| GET | `/cards/{code}` | **rewritten** — nearby search by room location × liked cuisines × price, cached, exclusion-filtered, ranked |
| POST | `/swipe` | key/field swap (`place_id`), generalized match check |
| GET | `/matches/{code}` | reused + snapshot refresh |
| PATCH | `/matches/{code}/{place_id}` | `visited` instead of `watched` |
| GET | `/tonight/{code}` | reused |

### What's Reused vs Replaced (from the code inventory)

**Reused untouched:** `api/client.ts`, `RoomContext`, room create/join
components, all `ui/*` components, layout shell + bottom nav, swipe gesture
engine (`SwipeCard`/`CardStack` mechanics), infra hooks (toast, online status,
SW update), `shared/dynamo.py`, `shared/response.py`, room Lambdas
(`create_room`/`join_room`/`get_room`), SAM template skeleton, PWA shell.

**Adapted (rename/re-field):** frontend types (`Card`→`RestaurantCard`, etc.),
`useCards`/`useSwipe` (key on `place_id`, drop mode), card renderers
(photo/rating/price/distance instead of poster/year/genres), matches UI
(`visited`), `record_swipe`/`get_matches`/`tonights_pick`/`update_match`
(key + field swap), `shared/validation.py` (cuisine vocab replaces
genres/eras), mock API layer (restaurant fixtures replace `MOCK_CARDS`).

**Replaced:** `shared/tmdb.py` → `shared/places.py` (keeping its 3-tier cache
structure), `get_cards` pipeline (location-aware nearby search),
onboarding content (cuisine swipe replaces genre/era/seed; `SeedSwipe` and
`EraSelect` are deleted), `CardDetail` content, `ModeContext`/`ModeToggle`
(deleted — single domain).

**Net-new:** location capture UI + `PUT /location` Lambda + geocoding,
geohash cache keys, distance calc (client-side haversine), Maps deep links,
snapshot-refresh logic.

### Path to the App Store

1. Build and polish as a PWA — instantly testable on your phone's browser and
   installable to the home screen throughout development.
2. When the PWA is solid, add **Capacitor** (`@capacitor/ios` +
   `@capacitor/geolocation`): the React app ships unchanged inside a native
   shell. Repo work (config, plugins, icons/splash, safe-area CSS) can happen
   in this environment; the **iOS build/sign/upload step requires macOS** —
   either your Mac with Xcode or a cloud macOS CI (Codemagic / GitHub Actions
   `macos` runners).
3. App Store needs: Apple Developer account ($99/yr), privacy policy +
   App Privacy labels (location + a room code — no accounts, minimal
   surface), review-proof "app-like" behavior (Capacitor handles this).

### Costs

| Item | Cost |
|------|------|
| AWS (Lambda, DynamoDB, API GW, S3/CloudFront) | < $1/mo (unchanged) |
| Google Places + Geocoding | $0 within per-SKU free caps at couple-scale; $5 budget alert as tripwire |
| Apple Developer (only when App Store stage starts) | $99/yr |
| TMDB | gone |

---

## Part III — Implementation Stages

Each stage ends in a working app. Mock-first: Stages 1–2 run entirely on the
existing mock API layer (`VITE_MOCK_API`), so the app is demoable in a browser
long before any Google or AWS work.

### Stage 0 — Prerequisites (one-time, mostly you)
- [ ] GCP project: enable **Places API (New)** + **Geocoding API**, create an
  API key (server-restricted), set a $5 budget alert
- [ ] Pick the app name (or bless the placeholder)
- Exit: API key in hand (only needed by Stage 3 — Stages 1–2 don't block on it)

### Stage 1 — Domain Swap on Mock Data (frontend only)
- New types (`RestaurantCard`, `Match` with `visited`, cuisine constants)
- Restaurant fixture data in `api/mock.ts` (~20 real-looking places w/ photos)
- `SwipeCard`/`CardStack`/`CardDetail` render restaurant fields
  (photo/rating/price/distance/open-now); match popup + list + Tonight's Pick
  re-fielded; `ModeContext`/`ModeToggle` removed
- Rebrand pass: name, manifest, icons, room-code prefix `EATS-`, storage keys,
  copy; delete/replace stale docs (`SHOWMANCE.md`, `IMPLEMENTATION_PLAN.md`),
  rewrite `CLAUDE.md` for the new domain
- Exit: full create-room → swipe → match → Tonight's Pick flow on mock data in
  a browser; tests green

### Stage 2 — Location + Cuisine Onboarding (frontend, still mock)
- Location Setup screen: GPS via `navigator.geolocation`, manual address
  field, radius pills; stored in room state (mocked)
- Cuisine Swipe onboarding (adapting `GenreSwipe`), price-comfort select
  (adapting `RoomSetup`), Compatibility Reveal re-themed
- Settings screen: edit location/radius/price, redo cuisines, leave room
- Exit: complete onboarding funnel on mock; distance shown on cards from mock
  coords

### Stage 3 — Backend Pivot (the real data)
- `shared/places.py`: Places (New) client + geohash-bucketed DynamoDB caching,
  field masks; verify field→SKU tiers against current Google docs
- Rewrite `get_cards`: room location × liked cuisines → cached nearby
  searches → merge/dedupe → exclude swiped → rank → batch of 20
- Key/field swap in `record_swipe` (generalized member-count match check),
  `get_matches` (+ snapshot refresh), `update_match`, `tonights_pick`,
  `save_preferences`, `validation.py`; members model in room Lambdas
- New `set_location` Lambda (`PUT /rooms/{code}/location`) with geocoding
- Update `template.yaml`; deploy via SAM; point frontend at the real API
- Exit: two phones, real nearby restaurants, real match end-to-end

### Stage 4 — Polish + Production PWA
- Match-list filters (cuisine/price), sorts (rating/distance/date), Visited
  flow, Maps deep links, empty/loading/error states
- `sw.js` image cache host swap (TMDB → Google photo host), install prompt,
  offline fallback re-check, Lighthouse (90+ perf / installable)
- Real-world shakedown: use it for actual dinners for a week; fix what annoys
- Exit: production-quality PWA at a public URL, used in anger

### Stage 5 — Capacitor + App Store
- Add Capacitor iOS shell + Geolocation plugin, icons/splash, safe-area CSS
- macOS build lane (your Mac or Codemagic/GH Actions), TestFlight, privacy
  policy + App Privacy labels, App Store listing assets
- Exit: TestFlight build on your phone → App Store submission

---

## Verification Plan

1. **Stages 1–2:** `npm run dev` with mocks; vitest suite updated alongside
   (CreateRoom/useCards/mock tests re-fielded); manual two-tab swipe-match walkthrough
2. **Stage 3:** `sam local start-api` first, then deployed; verify DynamoDB
   entities (SWIPE/SWIPED/MATCH with place_ids, CACHE hit-rate on repeat deck
   loads); confirm Google console shows calls only on cache misses
3. **Stage 4:** two-phone end-to-end (create → join → locate → cuisines →
   swipe → match → Tonight's Pick → directions link opens Maps → visited);
   Lighthouse audit; a week of real use
4. **Stage 5:** TestFlight install, GPS permission flow on device, offline
   behavior in the shell

---

## Open Questions

1. **Name** — Forkd is a placeholder; decide before the Stage 1 rebrand pass.
2. **Deck exhaustion** — small towns can run out of restaurants fast. MVP
   answer: "You've seen everything nearby — widen your radius?" prompt.
   Acceptable?
3. **Re-serving passes** — should left-swiped places come back after ~30 days
   (restaurants deserve second chances more than movies)? Proposed: yes,
   post-MVP.
4. **Chains** — filter out or keep McDonald's-tier chains? Proposed: keep for
   MVP (they're honest matches), add a "hide chains" filter later.
