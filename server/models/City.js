/**
 * City Model (Read-Only Query / Stub Model)
 * Matches Phase 0 schema: cities
 */

const db = require('../db');

class City {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.country = data.country;
    this.region = data.region || null;
    this.costIndex = data.costIndex !== undefined ? data.costIndex : (data.cost_index !== undefined ? data.cost_index : null);
    this.popularity = data.popularity !== undefined ? data.popularity : null;
    this.imageUrl = data.imageUrl || data.image_url || null;
    this.createdAt = data.createdAt || data.created_at || null;
  }

  static fromRow(row) {
    if (!row) return null;
    return new City({
      id: row.id,
      name: row.name,
      country: row.country,
      region: row.region,
      costIndex: row.cost_index,
      popularity: row.popularity,
      imageUrl: row.image_url,
      createdAt: row.created_at
    });
  }

  static async findById(id) {
    const query = `SELECT * FROM cities WHERE id = $1 LIMIT 1`;
    const res = await db.query(query, [id]);
    if (res.rows.length === 0) return null;
    return City.fromRow(res.rows[0]);
  }

  static async findByName(name) {
    const query = `SELECT * FROM cities WHERE LOWER(name) = LOWER($1) LIMIT 1`;
    const res = await db.query(query, [name.trim()]);
    if (res.rows.length === 0) return null;
    return City.fromRow(res.rows[0]);
  }

  static async findAll({ search, region } = {}) {
    let query = 'SELECT * FROM cities';
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (region) {
      params.push(region.trim().toLowerCase());
      conditions.push(`LOWER(region) = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY popularity DESC, name ASC';
    const res = await db.query(query, params);
    return res.rows.map(row => City.fromRow(row));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      country: this.country,
      region: this.region,
      costIndex: this.costIndex,
      popularity: this.popularity,
      imageUrl: this.imageUrl
    };
  }
}

module.exports = City;
