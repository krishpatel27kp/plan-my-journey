# 🗺️ Plan My Journey

A full-stack travel planning web application. Build multi-city itineraries, track budgets in Indian Rupees (₹), discover destinations, and share trips with friends — all in one modern, mobile-responsive interface.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Auth** | Email/password signup + Google OAuth, JWT sessions |
| **Dashboard** | Upcoming trips at a glance with budget progress |
| **Trip Builder** | Create trips with title, travel dates, and total budget |
| **Timeline View** | Connected vertical route ribbon with city stops, activities, and landmark photos |
| **Budget & Analysis** | Real-time budget vs. spent, daily average, category breakdown (Transport / Lodging / Food / Activities), per-destination bars |
| **Add Destinations** | Curated city catalog (Goa, Jaipur, Manali, Paris, Tokyo…) with ₹ cost-per-day, search, and category filters |
| **Add Activities** | Log scheduled activities to any stop with time, cost, and category |
| **Expense Tracking** | Manually add expenses per trip; auto-reflected in budget analysis |
| **Trip Sharing** | Generate a public read-only share link (no login required to view) |
| **Copy Trip** | Authenticated users can copy a shared trip into their own account |
| **Responsive** | Works on desktop and mobile |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 15

### 1 — Clone & install

```bash
git clone https://github.com/krishpatel27kp/plan-my-journey.git
cd plan-my-journey
npm install
cd client && npm install && cd ..
```

### 2 — Configure environment

```bash
cp .env.example .env
# Open .env and fill in DATABASE_URL and JWT_SECRET at minimum
```

### 3 — Initialise the database

```bash
psql $DATABASE_URL -f database/schema.sql
```

### 4 — (Optional) Seed city & activity data

```bash
node server/seed/seedCities.js
```

### 5 — Start both servers

```bash
# Backend (port 5000)
npm run dev

# Frontend (new terminal — port 5173 or next available)
npm run dev --prefix client
```

Open **`http://localhost:5173`** (or whichever port Vite picks) in your browser.

> **Note**: The frontend automatically detects `localhost` and routes API calls to `http://localhost:5000/api` — no manual configuration needed.

---

## 🗂️ Project Structure

```
plan-my-journey/
├── client/                   # Frontend (Vite, Vanilla JS)
│   ├── src/
│   │   ├── api.js            # API client (JWT, fetch wrapper)
│   │   ├── auth.js           # Token storage helpers
│   │   ├── App.js            # App root & client-side routing
│   │   └── components/
│   │       ├── Dashboard.js        # Dashboard with trip cards
│   │       ├── ItineraryBuilder.js # Timeline + Budget views
│   │       ├── AddCityModal.js     # Destination catalog modal
│   │       ├── AddActivityModal.js # Add activity to a stop
│   │       └── SharedTrip.js       # Public share view
│   └── index.html
│
├── server/                   # Backend (Express)
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── models/               # DB model classes (Trip, TripStop, User…)
│   ├── routes/
│   │   ├── auth.js           # POST /auth/register, /auth/login, /auth/google
│   │   ├── trips.js          # Trip CRUD, stops, budget, expenses
│   │   ├── cities.js         # City & activity search
│   │   ├── public.js         # Public share view (no auth)
│   │   ├── share.js          # Share & copy trip
│   │   ├── stopActivities.js # Add/remove activities on stops
│   │   └── users.js          # /users/me profile
│   ├── utils/
│   │   ├── auth.js           # JWT sign/verify
│   │   └── tripValidation.js # Request body validators
│   ├── seed/
│   │   └── seedCities.js     # Seed script for cities & activities
│   ├── db.js                 # PostgreSQL connection pool
│   ├── app.js                # Express app setup & route mounting
│   └── index.js              # Server entrypoint
│
├── database/
│   └── schema.sql            # Full DB schema (all tables)
│
└── .env.example              # Environment variable template
```

---

## 🗄️ Database Schema

All tables are defined in [`database/schema.sql`](database/schema.sql).

| Table | Description |
|---|---|
| `users` | User accounts & hashed credentials |
| `trips` | Trips with title, dates, budget (₹), status |
| `trip_stops` | Ordered city stops within a trip |
| `itinerary_activities` | Scheduled activities per stop (time, cost, category) |
| `expenses` | Manually-logged expenses per trip |
| `cities` | City catalog (name, country, region, cost index) |
| `activities` | Activity catalog per city |
| `shares` | Share tokens for public trip viewing |

---

## 🔌 API Reference

All endpoints are prefixed with `/api`. Authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Standard error shape

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human readable message" } }
```

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register with email + password |
| POST | `/api/auth/login` | No | Login, receive JWT |
| POST | `/api/auth/google` | No | Google OAuth sign-in |
| GET | `/api/users/me` | Yes | Get current user profile |
| PUT | `/api/users/me` | Yes | Update profile |

### Trips & Itinerary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/trips` | Yes | Create a new trip |
| GET | `/api/trips` | Yes | List user's trips |
| GET | `/api/trips/:id` | Yes | Get trip with stops & activities |
| PUT | `/api/trips/:id` | Yes | Update trip |
| DELETE | `/api/trips/:id` | Yes | Delete trip |
| POST | `/api/trips/:tripId/stops` | Yes | Add destination stop (`cityName` required; dates optional) |
| DELETE | `/api/stops/:stopId` | Yes | Remove a stop |
| PUT | `/api/trips/:tripId/stops/reorder` | Yes | Reorder stops |
| POST | `/api/stops/:stopId/activities` | Yes | Add activity to a stop |
| DELETE | `/api/itinerary-activities/:id` | Yes | Remove activity |
| GET | `/api/trips/:tripId/budget` | Yes | Live budget breakdown (category + destination) |
| POST | `/api/trips/:tripId/expenses` | Yes | Log a manual expense |

### Discovery & Sharing

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/cities` | No | Search / list cities |
| GET | `/api/cities/:cityId/activities` | No | Activities for a city |
| POST | `/api/trips/:tripId/share` | Yes | Generate public share link |
| GET | `/api/public/trips/:shareToken` | No | View shared trip (read-only) |
| POST | `/api/trips/:shareToken/copy` | Yes | Copy shared trip to own account |

---

## ⚙️ Environment Variables

Copy `.env.example` → `.env`. **Never commit `.env`.**

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | JWT signing secret (use a long random string) |
| `PORT` | No | `5000` | Backend server port |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL (used for CORS) |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `JWT_EXPIRES_IN` | No | `8h` | JWT token expiry |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID (for Google sign-in) |
| `PUBLIC_APP_BASE_URL` | No | `http://localhost:5173` | Base URL embedded in share links |

---

## 🧪 Running Tests

```bash
# From project root
npm test
```

Tests live in `server/test/` and cover route protection, auth flows, and validation.

---

## 📱 Key UX Flows

### Creating a New Trip
1. Click **"Plan New Journey"** on the Dashboard
2. Enter trip name, dates, and budget (₹)
3. The **Add Destination** modal opens automatically
4. Search and pick cities — they appear instantly in the **Timeline**
5. Add activities to each stop; costs flow into the **Budget & Analysis** view

### Budget & Analysis
- **Total Budget** vs **Spent** vs **Remaining** — live from DB
- **Daily Average** calculated from trip length
- **Spend by Category** — Transport · Lodging · Food · Activities
- **By Destination** — per-stop cost bars based on activity costs

### Sharing a Trip
1. Open any trip → click **🔗 Share**
2. A public URL is copied to clipboard
3. Anyone with the link can view the itinerary (no login required)
4. Logged-in users can click **Copy Trip** to clone it to their account

---

## 👥 Team & Git Workflow

**Branch naming:** `feature/<pillar>-<short-description>`

**Commit format:** `[pillar-A|B|C] <description>` or conventional commits

**Rules:**
1. Branch off the latest `main` before starting any feature.
2. One feature = one branch = one PR.
3. Rebase onto `main` before opening a PR: `git fetch origin && git rebase origin/main`
4. At least one teammate reviews and approves before merge.
5. Never commit `.env` or secrets.

---

## 🏗️ Built With

- **Frontend**: Vite, Vanilla JavaScript, CSS (no framework)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken) + Google OAuth
- **Images**: Unsplash (free-to-use landmark photos)
