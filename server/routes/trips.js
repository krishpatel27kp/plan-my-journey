/**
 * Trips Router — Pillar B (Itinerary & Trip Core)
 * Endpoints for Trip CRUD, user-scoping, TripStops creation, and sharing.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { Trip, TripStop, City } = require('../models');
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
    tripData.stops = stops.map(s => s.toJSON());

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

module.exports = router;
