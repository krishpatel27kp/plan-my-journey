/**
 * Trips Router — Pillar B (Itinerary & Trip Core)
 * Endpoints for Trip CRUD, user-scoping, TripStops creation, and sharing.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { Trip, TripStop, City, Activity } = require('../models');
const {
  validateCreateTrip,
  validateUpdateTrip,
  validateCreateStop,
  sendValidationError,
  sendNotFoundError
} = require('../utils/tripValidation');

// UUID format validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Protect all /api/trips routes with authentication
router.use(authMiddleware);

/**
 * POST /api/trips
 * Create a new trip for authenticated user
 * Validation: title, startDate, endDate required; budget optional numeric
 * Return: exactly { "id", "title", "startDate", "endDate", "budget", "userId" } with status 201
 */
router.post('/', async (req, res, next) => {
  try {
    const validation = validateCreateTrip(req.body);
    if (!validation.isValid) {
      return sendValidationError(res, validation.message);
    }

    const {
      title,
      startDate,
      endDate,
      start_date,
      end_date,
      budget,
      description,
      currency,
      coverImage,
      cover_image
    } = req.body;

    const start = startDate || start_date;
    const end = endDate || end_date;
    const cover = coverImage || cover_image;

    const trip = await Trip.create({
      userId: req.user.userId,
      title,
      description,
      startDate: start,
      endDate: end,
      budget: budget !== undefined && budget !== null && budget !== '' ? Number(budget) : 0.00,
      currency: currency || 'USD',
      coverImage: cover
    });

    // Return exactly the 6 requested fields with status 201
    return res.status(201).json(trip.toExactCreatedResponse());
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/trips
 * List all trips for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const trips = await Trip.findByUserId(req.user.userId);
    return res.status(200).json(trips.map(t => t.toJSON()));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/trips/:id
 * Retrieve specific trip owned by authenticated user
 * Return 404 (not 403) if trip does not exist or belongs to another user
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Reject non-UUID IDs immediately with 404
    if (!UUID_REGEX.test(id)) {
      return sendNotFoundError(res, 'Trip not found');
    }

    // Scoped to current user: returns null if unowned or non-existent
    const trip = await Trip.findByIdAndUserId(id, req.user.userId);
    if (!trip) {
      return sendNotFoundError(res, 'Trip not found');
    }

    // Fetch stops for this trip
    const stops = await TripStop.findByTripId(id);
    const tripData = trip.toJSON();
    tripData.stops = await Promise.all(stops.map(async (stop) => {
      const activities = await db.query(
        `SELECT ia.*, a.category FROM itinerary_activities ia
         LEFT JOIN activities a ON a.id = ia.activity_id
         WHERE ia.trip_stop_id = $1 ORDER BY ia.activity_date ASC, ia.start_time ASC, ia.order_index ASC`,
        [stop.id]
      );
      return {
        ...stop.toJSON(),
        activities: activities.rows.map(row => ({
          id: row.id,
          activityId: row.activity_id,
          title: row.title,
          category: row.category || null,
          date: row.activity_date,
          startTime: row.start_time,
          endTime: row.end_time,
          cost: Number(row.cost) || 0,
          notes: row.notes,
          status: row.status
        }))
      };
    }));

    return res.status(200).json(tripData);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/trips/:id
 * Update trip owned by authenticated user
 * Return 404 (not 403) if trip does not exist or belongs to another user
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      return sendNotFoundError(res, 'Trip not found');
    }

    // Verify ownership first
    const existing = await Trip.findByIdAndUserId(id, req.user.userId);
    if (!existing) {
      return sendNotFoundError(res, 'Trip not found');
    }

    const validation = validateUpdateTrip(req.body);
    if (!validation.isValid) {
      return sendValidationError(res, validation.message);
    }

    const updated = await Trip.update(id, req.user.userId, req.body);
    return res.status(200).json(updated.toJSON());
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/trips/:id
 * Delete trip owned by authenticated user
 * Return 404 (not 403) if trip does not exist or belongs to another user
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      return sendNotFoundError(res, 'Trip not found');
    }

    // Verify ownership first
    const existing = await Trip.findByIdAndUserId(id, req.user.userId);
    if (!existing) {
      return sendNotFoundError(res, 'Trip not found');
    }

    await Trip.delete(id, req.user.userId);
    return res.status(200).json({
      message: 'Trip deleted successfully',
      id
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/trips/:tripId/stops
 * Add a stop to a trip
 * Body: { cityId, startDate, endDate, stopOrder }
 * Validate the trip belongs to the requesting user before adding stop
 */
router.post('/:tripId/stops', async (req, res, next) => {
  try {
    const { tripId } = req.params;

    if (!UUID_REGEX.test(tripId)) {
      return sendNotFoundError(res, 'Trip not found');
    }

    // 1. Verify trip exists and belongs to requesting user
    const trip = await Trip.findByIdAndUserId(tripId, req.user.userId);
    if (!trip) {
      return sendNotFoundError(res, 'Trip not found');
    }

    // 2. Validate request body
    const validation = validateCreateStop(req.body);
    if (!validation.isValid) {
      return sendValidationError(res, validation.message);
    }

    const {
      cityId,
      city_id,
      startDate,
      endDate,
      start_date,
      end_date,
      stopOrder,
      stop_order,
      notes
    } = req.body;

    const cId = cityId || city_id;
    const start = startDate || start_date;
    const end = endDate || end_date;
    const order = stopOrder !== undefined ? stopOrder : stop_order;

    // 3. Resolve city name from database
    let cityName = req.body.cityName || req.body.city_name || '';
    if (cId) {
      const city = await City.findById(cId);
      if (city) {
        cityName = city.name;
      }
    }

    // 4. Create TripStop
    const stop = await TripStop.create({
      tripId,
      cityId: cId,
      cityName: cityName || 'Destination',
      stopOrder: parseInt(order, 10),
      startDate: start,
      endDate: end,
      notes
    });

    return res.status(201).json(stop.toJSON());
  } catch (err) {
    next(err);
  }
});

router.delete('/stops/:stopId', async (req, res, next) => {
  try {
    const result = await db.query(`
      DELETE FROM trip_stops WHERE id = $1 AND trip_id IN
      (SELECT id FROM trips WHERE user_id = $2) RETURNING id
    `, [req.params.stopId, req.user.userId]);
    if (!result.rows.length) return sendNotFoundError(res, 'Stop not found');
    return res.status(200).json({ id: req.params.stopId, deleted: true });
  } catch (err) { next(err); }
});

// POST /api/stops/:stopId/activities
router.post('/stops/:stopId/activities', async (req, res, next) => {
  try {
    const { stopId } = req.params;
    const { activityId, date, startTime, endTime, cost } = req.body || {};
    const stopResult = await db.query(
      `SELECT s.id, s.city_id, s.trip_id FROM trip_stops s
       JOIN trips t ON t.id = s.trip_id
       WHERE s.id = $1 AND t.user_id = $2`,
      [stopId, req.user.userId]
    );
    if (!stopResult.rows.length) return sendNotFoundError(res, 'Stop not found');
    if (!activityId || !date) return sendValidationError(res, 'activityId and date are required');
    const activity = await Activity.findById(activityId);
    if (!activity) return sendNotFoundError(res, 'Activity not found');
    if (activity.cityId !== stopResult.rows[0].city_id) {
      return sendValidationError(res, 'Activity must belong to the stop city');
    }
    const existing = await db.query(
      'SELECT COALESCE(MAX(order_index), 0) AS max_order FROM itinerary_activities WHERE trip_stop_id = $1',
      [stopId]
    );
    const result = await db.query(
      `INSERT INTO itinerary_activities
       (id, trip_stop_id, activity_id, title, activity_date, start_time, end_time, order_index, cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [crypto.randomUUID(), stopId, activityId, activity.name, date, startTime || null, endTime || null,
        Number(existing.rows[0].max_order) + 1, Number(cost) || 0]
    );
    const row = result.rows[0];
    return res.status(201).json({ id: row.id, activityId: row.activity_id, title: row.title, category: activity.category,
      date: row.activity_date, startTime: row.start_time, endTime: row.end_time, cost: Number(row.cost) || 0 });
  } catch (err) { next(err); }
});

// PUT /api/trips/:tripId/stops/reorder
router.put('/:tripId/stops/reorder', async (req, res, next) => {
  let client;
  try {
    const { tripId } = req.params;
    const stopIds = req.body?.stopIds;
    if (!Array.isArray(stopIds) || stopIds.length !== new Set(stopIds).size) {
      return sendValidationError(res, 'stopIds must be a list of unique stop IDs');
    }
    const trip = await Trip.findByIdAndUserId(tripId, req.user.userId);
    if (!trip) return sendNotFoundError(res, 'Trip not found');
    const owned = await db.query('SELECT id FROM trip_stops WHERE trip_id = $1', [tripId]);
    const ownedIds = new Set(owned.rows.map(row => row.id));
    if (stopIds.length !== ownedIds.size || stopIds.some(id => !ownedIds.has(id))) {
      return sendValidationError(res, 'stopIds must contain every stop in the trip exactly once');
    }
    client = db.connect ? await db.connect() : db;
    await client.query('BEGIN');
    for (let index = 0; index < stopIds.length; index++) {
      await client.query('UPDATE trip_stops SET stop_order = $1 WHERE id = $2 AND trip_id = $3', [index + 1, stopIds[index], tripId]);
    }
    await client.query('COMMIT');
    return res.status(200).json({ stopIds });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    if (client && client !== db && client.release) client.release();
  }
});

// DELETE /api/itinerary-activities/:id
router.delete('/itinerary-activities/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM itinerary_activities
       WHERE id = $1 AND trip_stop_id IN
       (SELECT s.id FROM trip_stops s JOIN trips t ON t.id = s.trip_id WHERE t.user_id = $2)
       RETURNING id`, [req.params.id, req.user.userId]
    );
    if (!result.rows.length) return sendNotFoundError(res, 'Itinerary activity not found');
    return res.status(200).json({ id: req.params.id });
  } catch (err) { next(err); }
});

// GET /api/trips/:tripId/budget
router.get('/:tripId/budget', async (req, res, next) => {
  try {
    const trip = await Trip.findByIdAndUserId(req.params.tripId, req.user.userId);
    if (!trip) return sendNotFoundError(res, 'Trip not found');
    const costs = await db.query(
      `SELECT ia.activity_date AS date, ia.cost, a.category, 'activity' AS source
       FROM itinerary_activities ia JOIN trip_stops s ON s.id = ia.trip_stop_id
       LEFT JOIN activities a ON a.id = ia.activity_id WHERE s.trip_id = $1
       UNION ALL SELECT expense_date AS date, amount AS cost, category, 'expense' AS source
       FROM expenses WHERE trip_id = $1`, [req.params.tripId]
    );
    const byCategory = { transport: 0, accommodation: 0, activities: 0, food: 0, other: 0 };
    const days = {};
    for (const row of costs.rows) {
      const amount = Number(row.cost) || 0;
      let bucket = String(row.category || '').toLowerCase();
      if (bucket.includes('transport') || bucket.includes('travel')) bucket = 'transport';
      else if (bucket.includes('accommod') || bucket.includes('hotel') || bucket.includes('lodg')) bucket = 'accommodation';
      else if (row.source === 'activity' || bucket.includes('activ') || bucket.includes('sight') || bucket.includes('tour')) bucket = 'activities';
      else if (bucket.includes('food') || bucket.includes('dining') || bucket.includes('meal')) bucket = 'food';
      else bucket = 'other';
      byCategory[bucket] += amount;
      if (row.date) days[row.date] = (days[row.date] || 0) + amount;
    }
    const start = trip.startDate ? new Date(`${trip.startDate}T00:00:00Z`) : null;
    const end = trip.endDate ? new Date(`${trip.endDate}T00:00:00Z`) : null;
    const tripLength = start && end ? Math.max(1, Math.floor((end - start) / 86400000) + 1) : 1;
    const dailyLimit = Number(trip.budget || 0) / tripLength;
    return res.status(200).json({ budget: Number(trip.budget) || 0, totalSpent: costs.rows.reduce((sum, row) => sum + (Number(row.cost) || 0), 0),
      remaining: (Number(trip.budget) || 0) - costs.rows.reduce((sum, row) => sum + (Number(row.cost) || 0), 0), byCategory,
      overBudgetDays: Object.keys(days).filter(date => days[date] > dailyLimit).sort() });
  } catch (err) { next(err); }
});

module.exports = router;
