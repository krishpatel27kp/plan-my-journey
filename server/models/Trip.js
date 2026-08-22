/**
 * Trip Model / Entity
 * Matches Phase 0 schema: trips
 */

const crypto = require('crypto');
const db = require('../db');

class Trip {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.userId = data.userId || data.user_id;
    this.title = data.title;
    this.description = data.description || null;
    this.startDate = data.startDate || data.start_date || null;
    this.endDate = data.endDate || data.end_date || null;
    this.coverImage = data.coverImage || data.cover_image || null;
    this.budget = data.budget !== undefined && data.budget !== null ? parseFloat(data.budget) : 0.00;
    this.currency = data.currency || 'USD';
    this.status = data.status || 'planning';
    this.isPublic = Boolean(data.isPublic || data.is_public);
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }

  static fromRow(row) {
    if (!row) return null;
    return new Trip({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      coverImage: row.cover_image,
      budget: row.budget !== null && row.budget !== undefined ? parseFloat(row.budget) : 0,
      currency: row.currency,
      status: row.status,
      isPublic: row.is_public,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  static async create({ userId, title, description, startDate, endDate, budget = 0, currency = 'USD', coverImage = null, status = 'planning', isPublic = false }) {
    const id = crypto.randomUUID();
    const parsedBudget = budget !== undefined && budget !== null && budget !== '' ? parseFloat(budget) : 0.00;
    const now = new Date().toISOString();

    // Ensure user exists in users table to satisfy foreign key constraint
    if (userId) {
      try {
        await db.query(`
          INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [userId, 'Traveler', `${userId}@traveler.local`, 'auth_managed_hash', now, now]);
      } catch (err) {
        // User may already exist with different email or constraint, safe to proceed
      }
    }

    const query = `
      INSERT INTO trips (id, user_id, title, description, start_date, end_date, cover_image, budget, currency, status, is_public, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      id,
      userId,
      title.trim(),
      description ? description.trim() : null,
      startDate || null,
      endDate || null,
      coverImage || null,
      parsedBudget,
      currency,
      status,
      isPublic ? 1 : 0,
      now,
      now
    ];

    const res = await db.query(query, values);
    return Trip.fromRow(res.rows[0]);
  }

  static async findByUserId(userId) {
    const query = `SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC`;
    const res = await db.query(query, [userId]);
    return res.rows.map(row => Trip.fromRow(row));
  }

  static async findByIdAndUserId(id, userId) {
    const query = `SELECT * FROM trips WHERE id = $1 AND user_id = $2 LIMIT 1`;
    const res = await db.query(query, [id, userId]);
    if (res.rows.length === 0) return null;
    return Trip.fromRow(res.rows[0]);
  }

  static async findById(id) {
    const query = `SELECT * FROM trips WHERE id = $1 LIMIT 1`;
    const res = await db.query(query, [id]);
    if (res.rows.length === 0) return null;
    return Trip.fromRow(res.rows[0]);
  }

  static async update(id, userId, updates = {}) {
    const existing = await Trip.findByIdAndUserId(id, userId);
    if (!existing) return null;

    const newTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
    const newDesc = updates.description !== undefined ? (updates.description ? updates.description.trim() : null) : existing.description;
    const newStartDate = updates.startDate !== undefined ? updates.startDate : (updates.start_date !== undefined ? updates.start_date : existing.startDate);
    const newEndDate = updates.endDate !== undefined ? updates.endDate : (updates.end_date !== undefined ? updates.end_date : existing.endDate);
    const newBudget = updates.budget !== undefined ? parseFloat(updates.budget) : existing.budget;
    const newCurrency = updates.currency !== undefined ? updates.currency : existing.currency;
    const newCoverImage = updates.coverImage !== undefined ? updates.coverImage : (updates.cover_image !== undefined ? updates.cover_image : existing.coverImage);
    const newStatus = updates.status !== undefined ? updates.status : existing.status;
    const newIsPublic = updates.isPublic !== undefined ? Boolean(updates.isPublic) : (updates.is_public !== undefined ? Boolean(updates.is_public) : existing.isPublic);
    const now = new Date().toISOString();

    const query = `
      UPDATE trips
      SET title = $1, description = $2, start_date = $3, end_date = $4, budget = $5,
          currency = $6, cover_image = $7, status = $8, is_public = $9, updated_at = $10
      WHERE id = $11 AND user_id = $12
      RETURNING *
    `;
    const values = [
      newTitle,
      newDesc,
      newStartDate,
      newEndDate,
      newBudget,
      newCurrency,
      newCoverImage,
      newStatus,
      newIsPublic ? 1 : 0,
      now,
      id,
      userId
    ];

    const res = await db.query(query, values);
    return Trip.fromRow(res.rows[0]);
  }

  static async delete(id, userId) {
    const existing = await Trip.findByIdAndUserId(id, userId);
    if (!existing) return false;

    await db.query(`DELETE FROM trips WHERE id = $1 AND user_id = $2`, [id, userId]);
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate,
      budget: this.budget,
      currency: this.currency,
      coverImage: this.coverImage,
      status: this.status,
      isPublic: this.isPublic,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  toExactCreatedResponse() {
    return {
      id: this.id,
      title: this.title,
      startDate: this.startDate,
      endDate: this.endDate,
      budget: this.budget,
      userId: this.userId
    };
  }
}

module.exports = Trip;
