# Showmance

Couples movie/show matching PWA. Tinder-style swiping on movies and TV shows powered by TMDB API. Partners swipe independently, matches appear in a shared list.

## Key Documents

- `SHOWMANCE.md` — Full product spec (features, screens, data model, API endpoints)
- `IMPLEMENTATION_PLAN.md` — Detailed build plan with architecture, DynamoDB schema, phased steps

Read both before making any architectural decisions.

## Tech Stack Decisions (Finalized)

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React + Vite + TypeScript | PWA, installable on home screen |
| Swipe gestures | framer-motion (custom) | NOT react-tinder-card (stale). Use drag="x", useMotionValue, useTransform |
| Routing | react-router-dom v6 | Protected routes check localStorage for room code |
| State mgmt | React Context + custom hooks | RoomContext, ModeContext. No Redux/Zustand |
| CSS | Vanilla CSS with custom properties | Dark theme. No Tailwind, no CSS-in-JS |
| Backend | Python 3.12 Lambda functions | AWS SAM for IaC |
| Database | DynamoDB single-table | PK/SK + 1 GSI. See IMPLEMENTATION_PLAN.md for schema |
| API | API Gateway HTTP API | CORS enabled, routes to Lambda |
| Content | TMDB API (free tier) | Cached in DynamoDB with TTL auto-delete |
| Hosting | S3 + CloudFront | Static PWA files |
| Notifications | On-next-open only | No WebSocket, no push notifications for MVP |

## Design System

- Dark theme: bg `#0f0f14`, surface `#1a1a24`, accent coral `#ff6b4a`, text `#f0f0f0`
- Bold poster imagery as focal point
- Minimal chrome, maximum content
- Min 44px touch targets
- Mobile-first, desktop fallback (arrow keys + buttons for swiping)

## DynamoDB Schema (Single Table: `showmance`)

Keys: PK (String), SK (String). GSI1: GSI1PK, GSI1SK. TTL attribute: `ttl`.

| Entity | PK | SK |
|--------|----|----|
| Room | `ROOM#{code}` | `METADATA` |
| Preferences | `ROOM#{code}` | `PREFS#{partner_id}` |
| Swipe | `ROOM#{code}` | `SWIPE#{media_type}#{tmdb_id}#{partner_id}` |
| Swiped Set | `ROOM#{code}` | `SWIPED#{media_type}#{partner_id}` |
| Match | `ROOM#{code}` | `MATCH#{media_type}#{tmdb_id}` |
| TMDB Cache | `CACHE#{cache_key}` | `DATA` |

GSI1 is for sorted match queries: `GSI1PK=ROOM#{code}#MATCHES#{media_type}`, `GSI1SK=matched_at`.

## Conventions

- Room codes follow pattern: `SHOW-XXXX` (4 alphanumeric chars)
- Partner identity is a UUID stored in localStorage (no auth system)
- Each Lambda function lives in `backend/functions/{name}/app.py` with a `handler(event, context)` entry point
- Shared code goes in the SAM Lambda Layer at `backend/layers/shared/python/shared/`
- All Lambda responses use the shared `response.py` helper (standardized JSON + CORS headers)
- TMDB responses are cached in DynamoDB with deterministic cache keys and TTL auto-cleanup
- Frontend API calls go through typed wrappers in `frontend/src/api/`
- Two modes (TV/Movie) maintain separate swipe history, match lists, and card decks

## Build Order

Follow the 4 phases in IMPLEMENTATION_PLAN.md sequentially. Each phase has clear exit criteria. Do not skip ahead — later phases depend on earlier infrastructure.

## Cost Target

Under $1/month total. Everything runs on AWS free tier (Lambda, DynamoDB, API Gateway) plus pennies for S3/CloudFront.
