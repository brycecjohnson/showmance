# Showmance 🎬❤️

**Tagline:** *Swipe together. Watch together.*

A couples movie/show matching PWA where you and your partner swipe right or left on titles, and when you both swipe right — it's a match. No more scrolling Netflix for 45 minutes.

---

## Vision

A lightweight, fun Progressive Web App that solves the nightly "what should we watch?" argument. Tinder-style card swiping on movies and TV shows, powered by TMDB's free API. Both partners install the PWA on their phone's home screen, swipe independently, and matches appear in a shared list. When you can't even decide among your matches, hit "Tonight's Pick" for a random selection.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | HTML/CSS/JS (vanilla or React) | PWA-ready, no build toolchain needed for vanilla |
| Backend API | AWS Lambda + API Gateway | Serverless, basically free at this scale |
| Database | DynamoDB | Simple key-value, free tier covers this easily |
| Movie Data | TMDB API (free tier) | Massive catalog, posters, trailers, genres, streaming providers |
| Hosting | S3 + CloudFront | Same pattern as Skyview, pennies/month |
| Auth | Simple invite code / shared room | No Cognito overhead — keep it lightweight |

---

## Modes

Showmance has two distinct modes, selectable from the main screen after joining a room:

### 📺 TV Mode
- Surfaces only TV series (TMDB `/discover/tv` and `/trending/tv/week`)
- Card shows: poster, title, seasons count, year started, rating, genre tags
- Detail view includes: episode count, status (ongoing/ended), network
- Best for: "We want a new series to binge"

### 🎬 Movie Mode
- Surfaces only movies (TMDB `/discover/movie` and `/trending/movie/week`)
- Card shows: poster, title, year, runtime, rating, genre tags
- Detail view includes: director, cast, runtime, trailer
- Best for: "We want something to watch tonight"

Each mode maintains its own swipe history and match list. Matches screen has a tab/toggle to switch between TV matches and movie matches.

---

## Onboarding Funnel (First-Time Room Setup)

The goal: calibrate the recommendation feed BEFORE the real swiping starts so the content feels relevant from the first card.

### Step 1: Pick Your Mode
- "What are you looking for tonight?" → TV Mode or Movie Mode
- Can always switch later from the main screen

### Step 2: Genre Vibes (Per Partner)
- Each partner independently swipes on ~15-20 genre cards
- Genres: Action, Comedy, Thriller, Sci-Fi, Horror, Romance, Drama, Documentary, Animation, Crime, Mystery, Fantasy, Reality, Western, Musical, War, Family, History
- Quick swipe — no details needed, just genre name + icon/color
- Results: app identifies genre overlap and unique preferences per partner

### Step 3: Era Preferences (Optional)
- Quick selection: Classics (pre-2000), 2000s, 2010s, New Releases (last 2 years), or "All Eras"
- Can multi-select
- Filters the discovery feed so you're not seeing 1980s titles if you only want recent stuff

### Step 4: Seed Titles (~10-15 well-known titles)
- Show popular, recognizable titles from their matched genres
- Each partner swipes independently
- This gives TMDB's recommendation engine strong signal
- Titles chosen for high recognition (Breaking Bad, The Office, Knives Out, Stranger Things, etc.)
- Also creates fun data: "You both loved The Office!" or "Bryce liked Interstellar but your partner passed 😬"

### Step 5: Compatibility Reveal
- Fun screen showing genre overlap, shared seed favorites, and a playful "compatibility score"
- Not meant to be accurate — meant to be fun and make it feel like a game
- "You're a 78% match — let's find your next watch!"

### Step 6: Discovery Feed Opens
- Real swipe deck begins, seeded by:
  1. Overlapping genre preferences (weighted highest)
  2. Seed title similarity (TMDB's "similar" and "recommendations" endpoints)
  3. Streaming service availability
  4. Era preference filter
- Feed gets smarter as more swipes come in

### Returning Sessions
- Skip straight to the swipe deck (onboarding only happens once per room)
- Can re-do genre preferences from settings if tastes change
- Mode toggle always available from main screen

---

## Core Features (MVP)

### 1. Room System
- One partner creates a "room" (generates a short code like `SHOW-7X3K`)
- Other partner joins with the code
- Room persists across sessions (DynamoDB)
- No accounts, no passwords — just the room code saved in localStorage-equivalent (or PWA state)

### 2. Swipe Interface
- Card stack UI showing movie/show poster, title, year, rating, genre tags
- Swipe right = interested, swipe left = pass
- Tap card to expand: description, cast, trailer link, where to stream
- Smooth touch gesture animations (CSS transforms + JS touch events)
- Satisfying "match" animation when both partners have swiped right

### 3. Match List
- Shared list of all titles both partners swiped right on
- **Tab toggle: TV Matches | Movie Matches**
- Filter by: genre, streaming service
- Sort by: date matched, rating, release year
- Mark as "watched" to clear from active list

### 4. Tonight's Pick
- Random selection from unmatched matches
- Fun reveal animation (slot machine? card flip?)
- Option to re-roll if you're not feeling it

### 5. Streaming Filter
- During room setup, select which streaming services you have
- TMDB provides "watch providers" data — filter titles to only show what's available on your services
- Supported: Netflix, Hulu, Disney+, HBO Max, Amazon Prime, Apple TV+, Peacock, Paramount+

### 6. PWA Features
- Installable on home screen (manifest.json)
- Offline fallback page
- Push notification potential for matches (stretch goal)
- Full-screen, no browser chrome

---

## Data Model (DynamoDB)

### Rooms Table
```
PK: ROOM#<room_code>
{
  room_code: "SHOW-7X3K",
  created_at: "2026-03-01T...",
  partner_1_id: "uuid-1",
  partner_2_id: "uuid-2",
  streaming_services: ["netflix", "hulu", "disney_plus"],
  genre_preferences: ["action", "comedy", "thriller"]  // optional filter
}
```

### Swipes Table
```
PK: ROOM#<room_code>
SK: SWIPE#<tmdb_id>#<partner_id>
{
  tmdb_id: 12345,
  partner_id: "uuid-1",
  direction: "right" | "left",
  swiped_at: "2026-03-01T...",
  title: "The Bear",          // denormalized for quick reads
  media_type: "tv" | "movie"
}
```

### Matches Table (or GSI)
```
PK: ROOM#<room_code>
SK: MATCH#<tmdb_id>
{
  tmdb_id: 12345,
  matched_at: "2026-03-01T...",
  title: "The Bear",
  poster_path: "/abc123.jpg",
  media_type: "tv",
  watched: false,
  watched_at: null
}
```

---

## API Endpoints (Lambda + API Gateway)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rooms` | Create a new room, returns room code + partner_1 ID |
| POST | `/rooms/{code}/join` | Join existing room, returns partner_2 ID |
| GET | `/rooms/{code}` | Get room details + settings |
| GET | `/cards/{code}` | Get next batch of titles to swipe (filtered, excludes already-swiped) |
| POST | `/swipe` | Record a swipe, check for match, return match status |
| GET | `/matches/{code}` | Get all matches for room |
| PATCH | `/matches/{code}/{tmdb_id}` | Mark as watched |
| GET | `/tonight/{code}` | Random pick from unwatched matches |

---

## TMDB API Integration

### Key Endpoints
- **Discover:** `/discover/movie` and `/discover/tv` — filtered by genre, rating, year
- **Trending:** `/trending/movie/week` and `/trending/tv/week` — good seed content
- **Watch Providers:** `/movie/{id}/watch/providers` — which streaming services carry it
- **Details:** `/movie/{id}` or `/tv/{id}` — full info, cast, trailer
- **Images:** `https://image.tmdb.org/t/p/w500{poster_path}` — poster images

### Content Strategy
1. Start with trending/popular titles (high recognition = more fun to swipe)
2. Mix in genre-based discovery based on room preferences
3. Track what's been shown to avoid repeats
4. Bias toward titles available on the room's streaming services

---

## UI/UX Design

### Screens
1. **Landing / Create Room** — App name, tagline, "Create Room" or "Join Room" buttons
2. **Room Setup** — Select streaming services
3. **Join Room** — Enter room code
4. **Mode Select** — TV Mode or Movie Mode toggle
5. **Genre Swipe** — Onboarding genre preference cards (first time only)
6. **Era Select** — Optional decade/era preference (first time only)
7. **Seed Titles** — Swipe on well-known titles to calibrate (first time only)
8. **Compatibility Reveal** — Fun partner overlap screen (first time only)
9. **Swipe Screen** — Card stack with poster, swipe gestures, match popup
10. **Card Detail** — Expanded view with description, cast, trailer, streaming info
11. **Matches List** — TV/Movie tabs, filters, "Tonight's Pick" button
12. **Tonight's Pick** — Fun reveal animation

### Design Vibe
- Dark theme (movie night aesthetic)
- Bold poster imagery as the focal point
- Warm accent color (coral/amber — romance without being cheesy)
- Minimal chrome, maximum content
- Satisfying micro-animations on swipe and match

### Swipe Mechanics
- Touch: drag card left/right, threshold to commit
- Visual: card tilts with drag, green/red overlay appears
- On release past threshold: card flies off screen
- Below threshold: card snaps back
- Desktop fallback: arrow keys or buttons

---

## Development Phases

### Phase 1: Foundation + Onboarding (Week 1-2)
- [ ] TMDB API key + test basic calls (discover, trending, watch providers)
- [ ] PWA shell (manifest, service worker, offline page)
- [ ] Landing page with create/join room flow
- [ ] DynamoDB tables + Lambda functions for room CRUD
- [ ] Mode select screen (TV / Movie toggle)
- [ ] Genre swipe onboarding flow
- [ ] Era preference selection
- [ ] Deploy to S3/CloudFront

### Phase 2: Core Swipe Experience (Week 2-3)
- [ ] Seed titles swipe flow (well-known titles per genre overlap)
- [ ] Compatibility reveal screen
- [ ] Card stack component with touch swipe gestures
- [ ] TMDB integration — fetch by genre overlap, trending, recommendations
- [ ] Swipe recording API (Lambda)
- [ ] Match detection logic
- [ ] Match animation/notification
- [ ] Separate swipe history per mode (TV vs Movie)

### Phase 3: Match Management (Week 3-4)
- [ ] Matches list screen with TV / Movie tab toggle
- [ ] Filter by genre, streaming service
- [ ] Mark as watched
- [ ] Tonight's Pick with reveal animation

### Phase 4: Polish & PWA (Week 4-5)
- [ ] Streaming service filter (TMDB watch providers)
- [ ] Card detail expansion (description, cast, trailer)
- [ ] PWA install prompt
- [ ] Loading states, error handling, empty states
- [ ] Mobile responsive polish

### Phase 5: Nice-to-Haves (Ongoing)
- [ ] "Super like" (must watch!)
- [ ] Watch history and stats ("You've matched 47 titles!")
- [ ] Genre compatibility score between partners
- [ ] "Mood" quick-filter (funny tonight? scary? light?)
- [ ] Share match to Messages ("Let's watch this tonight!")

---

## Infrastructure (AWS)

```
CloudFront (CDN + HTTPS)
    └── S3 Bucket (static PWA files)

API Gateway (REST)
    └── Lambda Functions (Node.js or Python)
        └── DynamoDB (rooms, swipes, matches)

TMDB API (external, free tier)
```

### Estimated Cost
- S3 + CloudFront: ~$0.50-1/month (same as Skyview)
- DynamoDB: Free tier (25 GB, 25 read/write capacity units)
- Lambda: Free tier (1M requests/month)
- API Gateway: Free tier (1M calls/month for 12 months)
- **Total: Under $2/month**

---

## Development Environment

### Local Development
- VS Code or any editor
- Claude Code with Remote Control (build from the couch!)
- AWS CLI configured for deployment
- TMDB API key (free at https://www.themoviedb.org/settings/api)

### Deployment
- `deploy.sh` script: build → sync to S3 → invalidate CloudFront cache
- Lambda deployment via AWS CLI or SAM
- Same CI/CD pattern as Skyview if desired later

---

## Portfolio Value

This project demonstrates:
- **Full-stack serverless architecture** (Lambda, API Gateway, DynamoDB, S3, CloudFront)
- **PWA development** (service workers, manifest, installable web apps)
- **Third-party API integration** (TMDB)
- **Real-time-ish collaboration** (two users, shared state)
- **Touch-first mobile UX** (swipe gestures, animations)
- **AWS cost optimization** (entire app under $2/month)
- **End-to-end ownership** from design to deployment to monitoring

---

## Open Questions
- Vanilla JS or React for the frontend? (Vanilla = simpler, React = more structured as it grows)
- Node.js or Python for Lambda functions? (Python aligns with your Locust/automation experience)
- How to handle "seen" state efficiently so partners don't re-see titles they already swiped on?
- Do we want real-time match notifications or just show on next app open?
- TMDB rate limiting strategy (40 requests per 10 seconds on free tier)

---

## Links & Resources
- TMDB API Docs: https://developer.themoviedb.org/docs
- PWA Guide: https://web.dev/progressive-web-apps/
- AWS SAM (Serverless Application Model): https://aws.amazon.com/serverless/sam/
- Touch gesture libraries: Hammer.js, or vanilla Touch Events API

---

*Built with Claude Code Remote Control from the couch. 🛋️*
