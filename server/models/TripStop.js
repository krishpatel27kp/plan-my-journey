/**
 * TripStop Model / Entity
 * Matches Phase 0 schema: trip_stops
 */

const crypto = require('crypto');
const db = require('../db');

class TripStop {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.tripId = data.tripId || data.trip_id;
    this.cityId = data.cityId || data.city_id || null;
    this.cityName = data.cityName || data.city_name || '';
    this.stopOrder = data.stopOrder !== undefined ? parseInt(data.stopOrder, 10) : (data.stop_order !== undefined ? parseInt(data.stop_order, 10) : 1);
    this.arrivalDate = data.arrivalDate || data.arrival_date || data.startDate || data.start_date || null;
    this.departureDate = data.departureDate || data.departure_date || data.endDate || data.end_date || null;
    this.notes = data.notes || null;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }

  static fromRow(row) {
    if (!row) return null;
    return new TripStop({
      id: row.id,
      tripId: row.trip_id,
      cityId: row.city_id,
      cityName: row.city_name,
      stopOrder: row.stop_order,
      arrivalDate: row.arrival_date,
      departureDate: row.departure_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  static async create({ tripId, cityId = null, cityName, stopOrder = 1, arrivalDate = null, departureDate = null, startDate = null, endDate = null, notes = null }) {
    const id = crypto.randomUUID();
    const arrDate = arrivalDate || startDate || null;
    const depDate = departureDate || endDate || null;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO trip_stops (id, trip_id, city_id, city_name, stop_order, arrival_date, departure_date, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      id,
      tripId,
      cityId || null,
      cityName ? cityName.trim() : 'Unknown Destination',
      parseInt(stopOrder, 10) || 1,
      arrDate,
      depDate,
      notes ? notes.trim() : null,
      now,
      now
    ];

    const res = await db.query(query, values);
    return TripStop.fromRow(res.rows[0]);
  }

  static async findByTripId(tripId) {
    const query = `SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY stop_order ASC, created_at ASC`;
    const res = await db.query(query, [tripId]);
    return res.rows.map(row => TripStop.fromRow(row));
  }

  static async findById(id) {
    const query = `SELECT * FROM trip_stops WHERE id = $1 LIMIT 1`;
    const res = await db.query(query, [id]);
    if (res.rows.length === 0) return null;
    return TripStop.fromRow(res.rows[0]);
  }

  static async delete(id) {
    const res = await db.query(`DELETE FROM trip_stops WHERE id = $1 RETURNING id`, [id]);
    return res.rows.length > 0;
  }

  toJSON() {
    return {
      id: this.id,
      tripId: this.tripId,
      cityId: this.cityId,
      cityName: this.cityName,
      stopOrder: this.stopOrder,
      startDate: this.arrivalDate,
      endDate: this.departureDate,
      arrivalDate: this.arrivalDate,
      departureDate: this.departureDate,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = TripStop;
