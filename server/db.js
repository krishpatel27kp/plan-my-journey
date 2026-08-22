const path = require('path');
const fs = require('fs');

// Safe dotenv loading
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}
loadEnv();

let pool;

// Check if PostgreSQL is available and configured
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  } catch (e) {
    // pg module not available, fall back to SQLite
  }
}

// If PG pool is not initialized, use embedded SQLite
if (!pool) {
  let sqliteDb;
  try {
    const { DatabaseSync } = require('node:sqlite');
    // Store in memory or local file
    const dbFilePath = process.env.SQLITE_DB_PATH || ':memory:';
    sqliteDb = new DatabaseSync(dbFilePath);
    sqliteDb.exec('PRAGMA foreign_keys = ON;');

    // Load and execute SQLite schema
    const schemaPath = path.join(__dirname, '../database/migrations/001_initial_schema_sqlite.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      sqliteDb.exec(schemaSql);
    }

    // Seed default cities if empty
    const cityCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM cities').get();
    if (!cityCount || cityCount.count === 0) {
      const crypto = require('crypto');
      const seedCities = [
        { name: 'Goa', country: 'India', region: 'west', costIndex: 3, popularity: 94, imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
        { name: 'Mumbai', country: 'India', region: 'west', costIndex: 4, popularity: 92, imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f' },
        { name: 'Delhi', country: 'India', region: 'north', costIndex: 3, popularity: 88, imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5' },
        { name: 'Bengaluru', country: 'India', region: 'south', costIndex: 3, popularity: 85, imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2' },
        { name: 'Paris', country: 'France', region: 'europe', costIndex: 5, popularity: 98, imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34' },
        { name: 'Tokyo', country: 'Japan', region: 'asia', costIndex: 4, popularity: 98, imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7' },
        { name: 'London', country: 'UK', region: 'europe', costIndex: 5, popularity: 97, imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad' },
        { name: 'New York', country: 'USA', region: 'north america', costIndex: 5, popularity: 99, imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9' }
      ];

      for (const c of seedCities) {
        const cityId = crypto.randomUUID();
        sqliteDb.prepare(`
          INSERT INTO cities (id, name, country, region, cost_index, popularity, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(cityId, c.name, c.country, c.region, c.costIndex, c.popularity, c.imageUrl);

        // Seed an activity
        const actId = crypto.randomUUID();
        sqliteDb.prepare(`
          INSERT INTO activities (id, city_id, name, category, duration_minutes, estimated_cost)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(actId, cityId, `${c.name} Exploration Tour`, 'Sightseeing', 120, 1500);
      }
    }
  } catch (err) {
    console.warn('Could not initialize SQLite:', err.message);
  }

  pool = {
    query: async (sqlText, params = []) => {
      if (!sqliteDb) {
        throw new Error('Database not connected');
      }

      try {
        // Translate PostgreSQL $1, $2, ... to SQLite ?
        let normalizedSql = sqlText.replace(/\$(\d+)/g, '?');

        // Translate ILIKE to LIKE for SQLite compatibility
        normalizedSql = normalizedSql.replace(/\bILIKE\b/gi, 'LIKE');

        // Translate NOW() to datetime('now')
        normalizedSql = normalizedSql.replace(/\bNOW\(\)/gi, "datetime('now')");

        const isSelect = /^\s*SELECT/i.test(normalizedSql);
        const hasReturning = /\bRETURNING\b/i.test(normalizedSql);

        const stmt = sqliteDb.prepare(normalizedSql);

        if (isSelect || hasReturning) {
          const rows = stmt.all(...params);
          return { rows: rows || [] };
        } else {
          const info = stmt.run(...params);
          return {
            rows: [],
            rowCount: info.changes,
            lastInsertRowid: info.lastInsertRowid
          };
        }
      } catch (err) {
        // Map unique constraint error
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
          const pgErr = new Error(err.message);
          pgErr.code = '23505';
          throw pgErr;
        }
        throw err;
      }
    },
    end: async () => {
      // no-op for embedded db
    }
  };
}

module.exports = pool;
