# plan-my-journey

A collaborative trip planning web application built during a team hackathon. Plan trips, build day-by-day itineraries, track budgets, discover cities & activities, and share your plans with friends.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 15 (or any PG-compatible database)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/krishpatel27kp/plan-my-journey.git
cd plan-my-journey

# 2. Create your local .env from the template
cp .env.example .env
# Fill in DATABASE_URL and any other values

# 3. Install dependencies
npm install

# 4. Run the database schema
psql $DATABASE_URL -f database/schema.sql

# 5. (Optional) Seed city & activity data — owned by Pillar C
node server/seed/seedCities.js

# 6. Start the dev server
npm run dev
```

The server runs on `http://localhost:5000` by default.

---

## Project Structure

```
client/              — Frontend (Vite + React)
server/              — Backend (Express)
  ├── middleware/     — Auth (JWT verification), error handler
  ├── routes/         — Route handlers by domain
  ├── services/       — Business logic (budget calculations, etc.)
  ├── seed/           — Seed scripts (Pillar C)
  ├── app.js          — Express app setup & route mounting
  ├── db.js           — PostgreSQL connection pool
  └── index.js        — Server entrypoint
database/            — SQL schema and migrations
  └── schema.sql      — Full database schema (all pillars)
tests/               — Automated test suites
```

---

## Database Schema

All tables are defined in [`database/schema.sql`](database/schema.sql), organized by pillar.

| Table                   | Owner    | Description                                     |
|-------------------------|----------|-------------------------------------------------|
| `users`                 | Pillar A | User accounts & auth credentials                |
| `trips`                 | Pillar B | User trips with title, dates, budget            |
| `trip_stops`            | Pillar B | Ordered city stops within a trip                 |
| `itinerary_activities`  | Pillar B | Scheduled activities within a stop               |
| `expenses`              | Pillar B | Categorized expenses for a trip                  |
| `cities`                | Pillar C | City catalog (name, country, region, cost index) |
| `activities`            | Pillar C | Activity catalog per city                        |
| `shares`                | Pillar C | Share tokens for public trip viewing             |

---

## API Contracts

All endpoints are prefixed with `/api`. Authenticated endpoints require `Authorization: Bearer <token>`.

### Standard Error Shape (all endpoints)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human readable message" } }
```

### Pillar A — User & Auth

| Method | Endpoint              | Auth | Description          |
|--------|-----------------------|------|----------------------|
| POST   | `/api/auth/register`  | No   | Register new user    |
| POST   | `/api/auth/login`     | No   | Login, receive JWT   |
| GET    | `/api/users/me`       | Yes  | Get current profile  |
| PUT    | `/api/users/me`       | Yes  | Update profile       |

### Pillar B — Itinerary & Trip Core

| Method | Endpoint                              | Auth | Description                      |
|--------|---------------------------------------|------|----------------------------------|
| POST   | `/api/trips`                          | Yes  | Create a new trip                |
| GET    | `/api/trips`                          | Yes  | List user's trips                |
| GET    | `/api/trips/:id`                      | Yes  | Get trip with stops & activities |
| PUT    | `/api/trips/:id`                      | Yes  | Update trip                      |
| DELETE | `/api/trips/:id`                      | Yes  | Delete trip                      |
| POST   | `/api/trips/:tripId/stops`            | Yes  | Add stop to trip                 |
| PUT    | `/api/stops/:stopId`                  | Yes  | Update stop                      |
| DELETE | `/api/stops/:stopId`                  | Yes  | Delete stop                      |
| PUT    | `/api/trips/:tripId/stops/reorder`    | Yes  | Reorder stops                    |
| POST   | `/api/stops/:stopId/activities`       | Yes  | Add activity to stop             |
| DELETE | `/api/itinerary-activities/:id`       | Yes  | Remove activity from itinerary   |
| GET    | `/api/trips/:tripId/budget`           | Yes  | Get budget breakdown             |

### Pillar C — Discovery, Sharing & Integrations

| Method | Endpoint                           | Auth | Description                     |
|--------|------------------------------------|------|---------------------------------|
| GET    | `/api/cities`                      | No   | Search/list cities              |
| GET    | `/api/cities/:cityId/activities`   | No   | List activities for a city      |
| POST   | `/api/trips/:tripId/share`         | Yes  | Generate share token            |
| GET    | `/api/public/trips/:shareToken`    | No   | View shared trip (read-only)    |
| POST   | `/api/trips/:shareToken/copy`      | Yes  | Copy a shared trip              |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. **Never commit `.env`.**

| Variable              | Required | Default                    | Description                    |
|-----------------------|----------|----------------------------|--------------------------------|
| `DATABASE_URL`        | Yes      | —                          | PostgreSQL connection string   |
| `PORT`                | No       | `5000`                     | Server port                    |
| `CLIENT_URL`          | No       | `http://localhost:5173`    | Frontend URL (CORS)            |
| `NODE_ENV`            | No       | `development`              | Environment mode               |
| `JWT_SECRET`          | Yes (A)  | —                          | JWT signing secret             |
| `JWT_EXPIRES_IN`      | No       | `1h`                       | JWT expiration                 |
| `PUBLIC_APP_BASE_URL` | No (C)   | `http://localhost:5173`    | Base URL for share links       |

---

## Team & Git Workflow

**Branch naming:** `feature/<pillar>-<short-description>`

**Commit format:** `[pillar-A|B|C] <description>`

**Rules:**
1. Branch off the latest `main` before starting any feature.
2. One feature = one branch = one PR.
3. Rebase onto `main` before opening a PR: `git fetch origin && git rebase origin/main`.
4. At least one teammate reviews and approves before merge.
5. Squash-merge into `main`.
6. Never commit `.env` or secrets.

---

## Team Pillars

| Pillar | Scope                                                            |
|--------|------------------------------------------------------------------|
| **A**  | Signup/Login, JWT auth, session middleware, Dashboard, Profile    |
| **B**  | Trips, Stops, Activities, Itinerary Builder, Timeline, Budget    |
| **C**  | City/Activity search & seed data, Share page, Copy Trip          |
