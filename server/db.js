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
let sqliteDb;

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
        let workingSql = sqlText;

        // Auto-inject UUID for INSERT statements where id column is omitted (matching Postgres gen_random_uuid default)
        const crypto = require('crypto');
        const insertMatch = sqlText.match(/^\s*INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+)$/i);
        if (insertMatch) {
          const table = insertMatch[1];
          const cols = insertMatch[2];
          const afterValues = insertMatch[3];
          const colNames = cols.split(',').map(c => c.trim().toLowerCase());
          if (!colNames.includes('id')) {
            const onConflictIdx = afterValues.search(/\bON\s+CONFLICT\b/i);
            const valueTuplesPart = onConflictIdx !== -1 ? afterValues.slice(0, onConflictIdx) : afterValues;
            const suffixPart = onConflictIdx !== -1 ? afterValues.slice(onConflictIdx) : '';

            const updatedColsSql = 'INSERT INTO ' + table + ' (id, ' + cols + ') VALUES ';
            const updatedTuples = valueTuplesPart.replace(/\(([^)]+)\)/g, (match, tupleContent) => {
              const newId = crypto.randomUUID();
              return "('" + newId + "', " + tupleContent + ")";
            });
            workingSql = updatedColsSql + updatedTuples + suffixPart;
          }
        }

        // Translate PostgreSQL $1, $2, ... to SQLite ? while expanding positional params
        let normalizedParams = [];
        let normalizedSql = workingSql.replace(/\$(\d+)/g, (match, paramNum) => {
          const idx = parseInt(paramNum, 10) - 1;
          normalizedParams.push(params[idx]);
          return '?';
        });
        if (normalizedParams.length === 0) {
          normalizedParams = [...params];
        }

        // Translate ILIKE to LIKE for SQLite compatibility
        normalizedSql = normalizedSql.replace(/\bILIKE\b/gi, 'LIKE');

        // Translate NOW() to datetime('now')
        normalizedSql = normalizedSql.replace(/\bNOW\(\)/gi, "datetime('now')");

        const isSelect = /^\s*SELECT/i.test(normalizedSql);
        const hasReturning = /\bRETURNING\b/i.test(normalizedSql);

        const stmt = sqliteDb.prepare(normalizedSql);

        if (isSelect || hasReturning) {
          const rows = stmt.all(...normalizedParams);
          return { rows: rows || [] };
        } else {
          const info = stmt.run(...normalizedParams);
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
    },
    transaction: async (callback) => {
      sqliteDb.exec('BEGIN');
      try {
        const result = await callback(pool);
        sqliteDb.exec('COMMIT');
        return result;
      } catch (err) {
        sqliteDb.exec('ROLLBACK');
        throw err;
      }
    }
  };
}

if (pool && !pool.transaction) {
  pool.transaction = async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  };
}

module.exports = pool;
