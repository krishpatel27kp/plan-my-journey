# plan-my-journey — Technical Delegation Plan

**Repository:** https://github.com/krishpatel27kp/plan-my-journey
**Team size:** 3 developers
**Window:** 8 hours
**Role:** Senior Technical Lead / PM orchestration doc

This document exists so Teammate A, B, and C can work in parallel for the full 8 hours with the minimum possible number of blocking dependencies. Read Section 1 (execution order) before writing any code — it tells you exactly when your pillar is safe to start.

---

## 1. Feature Delegation & Prioritization

### The Three Pillars

| Pillar | Owner | Scope |
|---|---|---|
| **A — User & Auth** | Teammate A | Signup/Login, JWT auth, session middleware, Dashboard, Profile/Settings |
| **B — Itinerary & Trip Core** | Teammate B | Trips, Stops, Activities, Itinerary Builder, Timeline, Budget |
| **C — Discovery, Sharing & Integrations** | Teammate C | City/Activity search & seed data, Public Share page, Copy Trip, notifications/stretch integrations |

**Why this split:** Pillar B and C both need a `user_id` and a valid session to attach data to. Pillar A is therefore the one true blocking dependency — everything else can be built in parallel *once A's auth contract exists as a stub*, even before it's fully implemented.

### Prioritized Execution Order

**Phase 0 — Foundation Freeze (Hour 0:00 – 0:30, all three together)**
- Agree and commit the DB schema (`users`, `trips`, `cities`, `trip_stops`, `activities`, `itinerary_activities`, `expenses`, `shares`)
- Agree and commit the API contracts in Section 2 — **do not deviate from these without a team-wide message**
- Teammate A pushes an auth middleware **stub** immediately (accepts a hardcoded test JWT) so B and C are never blocked waiting for real auth
- Repo scaffolded: `client/`, `server/`, `database/`, `.env.example`, `README.md`

**Phase 1 — Critical Path (Hour 0:30 – 2:00)**
- **Teammate A (blocking priority):** finishes real `/auth/register`, `/auth/login`, JWT issuance and middleware. This must land by hour 2:00 — it's the one thing the other two pillars eventually depend on for real (not stubbed) auth.
- **Teammate B (parallel, using A's stub token):** Trip + TripStop + City + Activity models, `POST /trips`, `POST /trips/:id/stops`
- **Teammate C (parallel, no auth dependency):** seed script for 30–50 cities/activities, `GET /cities`, `GET /cities/:id/activities` — this work has zero dependency on A or B and should start immediately

**Phase 2 — Core Build (Hour 2:00 – 5:00)**
- **A:** Dashboard, Profile/Settings screen, swap all stub tokens for real auth across the app
- **B:** Itinerary Builder UI, reorder stops, add activities to stops, Timeline view, Budget calculation endpoint + UI
- **C:** City/Activity search UI with filters, Share token generation (`POST /trips/:id/share`), Public Share page (`GET /public/trips/:token`)

**Phase 3 — Integration & Polish (Hour 5:00 – 7:00)**
- All three: replace any remaining mocked data with live API calls
- **A:** protects all routes with real middleware, checks token expiry handling
- **B:** budget alerts (over-budget warning), empty/loading states on itinerary
- **C:** "Copy Trip" button wired to actually clone a shared trip into the viewer's account (requires A's auth — do this only after Phase 1 auth is confirmed live)

**Phase 4 — Freeze & Demo Prep (Hour 7:00 – 8:00)**
- No new features. Bug fixes and UI polish only.
- Full run-through of: Signup → Dashboard → Create Trip → Build Itinerary → Budget → Share → Copy Trip

---

## 2. API Contracts

All endpoints are prefixed `/api`. All authenticated endpoints require `Authorization: Bearer <token>`.

### Shared: JWT Payload Shape (owned by Teammate A, consumed by B & C)
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "iat": 1699999999,
  "exp": 1700003599
}
```

### Pillar A — User & Auth

```http
POST /api/auth/register
```
Request:
```json
{ "name": "Krish Patel", "email": "krish@example.com", "password": "string" }
```
Response `201`:
```json
{ "id": "uuid", "name": "Krish Patel", "email": "krish@example.com", "token": "jwt-string" }
```

```http
POST /api/auth/login
```
Request:
```json
{ "email": "krish@example.com", "password": "string" }
```
Response `200`:
```json
{ "id": "uuid", "name": "Krish Patel", "email": "krish@example.com", "token": "jwt-string" }
```

```http
GET /api/users/me
PUT /api/users/me
```
Response `200`:
```json
{ "id": "uuid", "name": "Krish Patel", "email": "krish@example.com", "profileImage": "url|null" }
```

### Pillar B — Itinerary & Trip Core

```http
GET    /api/trips
POST   /api/trips
GET    /api/trips/:id
PUT    /api/trips/:id
DELETE /api/trips/:id
```
`POST /api/trips` request:
```json
{ "title": "Goa Escape", "description": "string", "startDate": "2026-09-10", "endDate": "2026-09-15", "budget": 50000 }
```
Response `201`:
```json
{ "id": "uuid", "title": "Goa Escape", "startDate": "2026-09-10", "endDate": "2026-09-15", "budget": 50000, "userId": "uuid" }
```

```http
POST   /api/trips/:tripId/stops
PUT    /api/stops/:stopId
DELETE /api/stops/:stopId
PUT    /api/trips/:tripId/stops/reorder
```
`POST .../stops` request:
```json
{ "cityId": "uuid", "startDate": "2026-09-10", "endDate": "2026-09-12", "stopOrder": 1 }
```

```http
POST   /api/stops/:stopId/activities
DELETE /api/itinerary-activities/:id
```
Request:
```json
{ "activityId": "uuid", "date": "2026-09-10", "startTime": "09:00", "endTime": "11:00", "cost": 500 }
```

```http
GET /api/trips/:tripId/budget
```
Response `200`:
```json
{
  "budget": 50000,
  "totalSpent": 42700,
  "remaining": 7300,
  "byCategory": { "transport": 25000, "accommodation": 0, "activities": 12000, "food": 5700, "other": 0 },
  "overBudgetDays": ["2026-09-12"]
}
```

### Pillar C — Discovery, Sharing & Integrations

```http
GET /api/cities?search=goa&region=west
```
Response `200`:
```json
[{ "id": "uuid", "name": "Goa", "country": "India", "costIndex": 3, "popularity": 94, "imageUrl": "url" }]
```

```http
GET /api/cities/:cityId/activities?category=adventure
```
Response `200`:
```json
[{ "id": "uuid", "name": "Scuba Diving", "category": "Adventure", "durationMinutes": 180, "estimatedCost": 2500 }]
```

```http
POST /api/trips/:tripId/share
```
Response `201`:
```json
{ "shareToken": "a8x92k", "publicUrl": "https://plan-my-journey.app/share/a8x92k" }
```

```http
GET /api/public/trips/:shareToken
```
Response `200` (no auth required, read-only):
```json
{ "title": "Goa Escape", "stops": [ { "city": "Goa", "startDate": "2026-09-10", "activities": ["Scuba Diving", "Baga Beach"] } ], "totalCost": 42700 }
```

```http
POST /api/trips/:shareToken/copy
```
Requires auth (this is Phase 3, post-Phase-1-auth). Response `201`:
```json
{ "newTripId": "uuid" }
```

### Standard Error Shape (all pillars)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human readable message" } }
```

---

## 3. Git & Pull Request Workflow

**Branch protection:** `main` is protected. No direct pushes. Every change lands via PR.

**Branch naming convention:**
```
feature/<pillar>-<short-description>
```
Examples:
```
feature/auth-jwt-middleware
feature/itinerary-timeline-view
feature/discovery-city-search
```

**Rules:**
1. Branch off the latest `main` before starting any feature — `git pull origin main` first.
2. One feature = one branch = one PR. Don't bundle unrelated changes.
3. Rebase onto `main` before opening a PR if `main` has moved: `git fetch origin && git rebase origin/main`.
4. PR description must state: what changed, which API contract section it implements (reference Section 2 by pillar), and how to test it locally.
5. At least one of the other two teammates reviews and approves before merge — but keep reviews fast (target: under 10 minutes) given the time constraint. A quick "LGTM" plus a skim of the diff is enough for an 8-hour hackathon; don't block on nitpicks.
6. Resolve merge conflicts locally on your feature branch, never on `main`.
7. Squash-merge into `main` to keep history readable.
8. If your feature depends on another pillar's endpoint that isn't merged yet, build against the **contract in Section 2**, not against the other person's live branch. This is exactly why the contract is frozen in Phase 0.

**Suggested commit message format:**
```
[pillar-A] add JWT auth middleware and login endpoint
```

---

## 4. Environment Variables Management

### Required variables by pillar

**Shared (all pillars need these to run the app at all):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/plan_my_journey
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Pillar A — User & Auth:**
```
JWT_SECRET=
JWT_EXPIRES_IN=1h
```

**Pillar B — Itinerary & Trip Core:**
```
# No additional secrets required beyond DATABASE_URL
```

**Pillar C — Discovery, Sharing & Integrations:**
```
PUBLIC_APP_BASE_URL=http://localhost:5173
# Only if pursuing stretch integrations:
CLOUDINARY_URL=            # if using image uploads for city photos
EMAIL_SERVICE_API_KEY=     # only if notifications are attempted post-MVP
```

### Rules — read before your first commit

1. **`.env` is never committed.** It must be listed in `.gitignore` at the repo root before anyone writes code. Verify this in Phase 0.
2. **`.env.example` is committed to `main`** and contains every variable name above with empty or placeholder values — no real secrets, no real DB passwords:
   ```
   DATABASE_URL=
   PORT=5000
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   JWT_SECRET=
   JWT_EXPIRES_IN=1h
   PUBLIC_APP_BASE_URL=http://localhost:5173
   ```
3. **Sync workflow when a new variable is introduced mid-hackathon:**
   - Add the placeholder key to `.env.example` in the same PR that introduces the code needing it.
   - Post the new variable name (not the value) in the team chat.
   - Each teammate copies `.env.example` to their local `.env` (`cp .env.example .env`) and fills in their own local/shared value — never paste real secrets into chat; share DB credentials via a private channel or a shared password manager entry, not Slack/WhatsApp text.
4. If a secret is accidentally committed, treat it as compromised: rotate it (regenerate `JWT_SECRET`, reset the DB password) rather than just deleting it from a later commit — git history still holds it.

---

## Quick Reference: What Blocks What

```
Phase 0 (all)  →  schema + contract frozen, auth STUB live
      ↓
Phase 1: A builds real auth  ║  B builds Trip/Stop models  ║  C builds seed data + city search
      ↓ (A's real auth must be live by 2:00)
Phase 2: A → Dashboard/Profile  ║  B → Itinerary Builder/Budget  ║  C → Search UI + Share
      ↓
Phase 3: Integration — swap stubs for real auth everywhere, wire Copy Trip (needs real auth)
      ↓
Phase 4: Freeze, polish, demo rehearsal
```
