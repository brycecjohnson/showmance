# Forkd

Couples restaurant-matching PWA. Tinder-style swiping: a quick cuisine round to
calibrate tastes, then real nearby restaurants from Google Places. Partners
swipe independently; mutual right-swipes land in a shared "Places to Try" list.

This repo was pivoted from Showmance (movie/TV matching) — the room system,
swipe engine, match pipeline, and AWS backend carry over; the content domain
changed from TMDB titles to restaurants.

## Key Documents

- `DESIGN.md` — Full product spec, data-source design (Google Places + caching),
  DynamoDB schema, API endpoints, and the staged implementation plan.

Read it before making any architectural decisions.

## Pivot Status

- **Stage 1 (done)**: frontend domain swap on mock data + rebrand
- **Stage 2 (next)**: location capture + settings screens
- **Stage 3 (pending)**: backend pivot — `backend/` still contains the TMDB-era
  Lambdas; they are replaced in Stage 3 per DESIGN.md. Don't extend the TMDB
  code paths.

## Tech Stack Decisions (Finalized)

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React + Vite + TypeScript | PWA, installable on home screen |
| Swipe gestures | framer-motion (custom) | NOT react-tinder-card (stale). Use drag="x", useMotionValue, useTransform |
| Routing | react-router-dom | Protected routes check localStorage for room code |
| State mgmt | React Context + custom hooks | RoomContext. No Redux/Zustand |
| CSS | Vanilla CSS with custom properties | Dark theme. No Tailwind, no CSS-in-JS |
| Backend | Python 3.12 Lambda functions | AWS SAM for IaC |
| Database | DynamoDB single-table | PK/SK + 1 GSI. See DESIGN.md for schema |
| API | API Gateway HTTP API | CORS enabled, routes to Lambda |
| Content | Google Places API (New) + Geocoding | Cached in DynamoDB with TTL; field masks kept lean to control SKU cost |
| Hosting | S3 + CloudFront | Static PWA files |
| Notifications | On-next-open only | No WebSocket, no push notifications for MVP |
| iOS | Capacitor wrap (Stage 5) | PWA first; native shell only for App Store submission |

## Design System

- Dark theme: bg `#0f0f14`, surface `#1a1a24`, accent coral `#ff6b4a`, text `#f0f0f0`
- Bold restaurant photography as focal point
- Minimal chrome, maximum content
- Min 44px touch targets
- Mobile-first, desktop fallback (arrow keys + buttons for swiping)

## DynamoDB Schema (Single Table: `showmance`)

Keys: PK (String), SK (String). GSI1: GSI1PK, GSI1SK. TTL attribute: `ttl`.
The old `{media_type}` key slot became the domain slot (`restaurant`).

| Entity | PK | SK |
|--------|----|----|
| Room | `ROOM#{code}` | `METADATA` |
| Preferences | `ROOM#{code}` | `PREFS#{member_id}` |
| Swipe | `ROOM#{code}` | `SWIPE#restaurant#{place_id}#{member_id}` |
| Swiped Set | `ROOM#{code}` | `SWIPED#restaurant#{member_id}` |
| Match | `ROOM#{code}` | `MATCH#restaurant#{place_id}` |
| Places Cache | `CACHE#{cache_key}` | `DATA` |

GSI1 is for sorted match queries: `GSI1PK=ROOM#{code}#MATCHES#restaurant`,
`GSI1SK=matched_at`.

## Conventions

- Room codes follow pattern: `EATS-XXXX` (4 alphanumeric chars)
- Member identity is a UUID stored in localStorage (no auth system); rooms are
  couples-first but the data model is group-ready (`members` map, match =
  all members swiped right)
- Each Lambda function lives in `backend/functions/{name}/app.py` with a `handler(event, context)` entry point
- Shared code goes in the SAM Lambda Layer at `backend/layers/shared/python/shared/`
- All Lambda responses use the shared `response.py` helper (standardized JSON + CORS headers)
- Google Places responses are cached in DynamoDB under geohash-bucketed keys
  with TTL auto-cleanup; place data caches max 30 days (ToS), `place_id` may
  persist indefinitely
- Frontend API calls go through typed wrappers in `frontend/src/api/`; the mock
  layer (`frontend/src/api/mock.ts`) is active whenever `VITE_API_URL` is unset
- Restaurant photos load from full URLs on the card (`photo_url`) — no image
  host is hardcoded in components (the service worker whitelists photo hosts)

## Build Order

Follow the stages in DESIGN.md sequentially. Each stage has clear exit
criteria. Do not skip ahead — later stages depend on earlier infrastructure.

## Cost Target

Under $1/month total. AWS free tier (Lambda, DynamoDB, API Gateway) plus
pennies for S3/CloudFront. Google Places stays inside per-SKU free caps via
caching; a $5 GCP budget alert is the tripwire.
