-- plan-my-journey database schema
-- Phase 0: Foundation Freeze — each pillar adds its own tables below.
-- Do NOT edit another pillar's section to avoid merge conflicts.

-- ============================================================
-- Pillar A — User & Auth  (owned by Teammate A)
-- Tables: users
-- Teammate A will add the CREATE TABLE statements here.
-- ============================================================


-- ============================================================
-- Pillar B — Itinerary & Trip Core  (owned by Teammate B)
-- Tables: trips, trip_stops, itinerary_activities, expenses
-- Teammate B will add the CREATE TABLE statements here.
-- ============================================================


-- ============================================================
-- Pillar C — Discovery, Sharing & Integrations  (owned by Teammate C)
-- Tables: cities, activities, shares
-- ============================================================

CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    cost_index INT,
    popularity INT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cities_name_country UNIQUE (name, country)
);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    duration_minutes INT,
    estimated_cost NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_activities_city_name UNIQUE (city_id, name)
);

-- Note: shares references trips(id), which is owned by Pillar B.
-- Pillar B must create the trips table before this FK can be enforced.
-- During Phase 0 scaffold this table is defined but the FK will only
-- resolve once Pillar B's trips table exists in the same migration.
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL, -- FK to trips(id), added after Pillar B lands trips table
    share_token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- After Pillar B's trips table is merged, run:
-- ALTER TABLE shares ADD CONSTRAINT fk_shares_trip_id FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
