/**
 * Activity Model
 * Matches Phase 0 schema: activities
 */

const crypto = require('crypto');
const db = require('../db');

class Activity {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.cityId = data.cityId || data.city_id;
    this.name = data.name;
    this.category = data.category || null;
    this.durationMinutes = data.durationMinutes !== undefined ? data.durationMinutes : (data.duration_minutes !== undefined ? data.duration_minutes : null);
    this.estimatedCost = data.estimatedCost !== undefined && data.estimatedCost !== null ? parseFloat(data.estimatedCost) : (data.estimated_cost !== undefined && data.estimated_cost !== null ? parseFloat(data.estimated_cost) : null);
    this.createdAt = data.createdAt || data.created_at || null;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Activity({
      id: row.id,
      cityId: row.city_id,
      name: row.name,
      category: row.category,
      durationMinutes: row.duration_minutes,
      estimatedCost: row.estimated_cost,
      createdAt: row.created_at
    });
  }

  static async findById(id) {
    const query = `SELECT * FROM activities WHERE id = $1 LIMIT 1`;
    const res = await db.query(query, [id]);
    if (res.rows.length === 0) return null;
    return Activity.fromRow(res.rows[0]);
  }

  static async findByCityId(cityId, { category } = {}) {
    let query = 'SELECT * FROM activities WHERE city_id = $1';
    const params = [cityId];

    if (category) {
      params.push(category.trim());
      query += ` AND category ILIKE $${params.length}`;
    }

    query += ' ORDER BY name ASC';
    const res = await db.query(query, params);
    return res.rows.map(row => Activity.fromRow(row));
  }

  toJSON() {
    return {
      id: this.id,
      cityId: this.cityId,
      name: this.name,
      category: this.category,
      durationMinutes: this.durationMinutes,
      estimatedCost: this.estimatedCost
    };
  }
}

module.exports = Activity;
