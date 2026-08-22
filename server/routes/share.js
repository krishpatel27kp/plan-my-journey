// server/routes/share.js
// Pillar C — Sharing: Share token generation & Copy Trip (requires auth)
// Phase 2 implementation

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

/**
 * Generate a cryptographically secure, readable 6-character alphanumeric share token
 */
function generateShareToken(length = 6) {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let token = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

// POST /api/trips/:tripId/share — Generate/retrieve public share token for a trip
router.post('/:tripId/share', authMiddleware, async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tripId)) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    // Verify trip exists and check ownership
    const tripResult = await db.query(
      'SELECT id, user_id, title FROM trips WHERE id = $1',
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Trip not found'
        }
      });
    }

    const trip = tripResult.rows[0];

    // Verify authenticated user owns the trip
    if (trip.user_id !== req.user.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to share this trip'
        }
      });
    }

    // Check if an unexpired share token already exists for this trip
    const existingShare = await db.query(
      'SELECT share_token FROM shares WHERE trip_id = $1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC LIMIT 1',
      [tripId]
    );

    let shareToken;

    if (existingShare.rows.length > 0) {
      shareToken = existingShare.rows[0].share_token;
    } else {
      // Generate a collision-free token
      let unique = false;
      let attempts = 0;
      while (!unique && attempts < 10) {
        attempts++;
        shareToken = generateShareToken(6);
        const collisionCheck = await db.query(
          'SELECT id FROM shares WHERE share_token = $1',
          [shareToken]
        );
        if (collisionCheck.rows.length === 0) {
          unique = true;
        }
      }

      if (!unique) {
        throw new Error('Failed to generate unique share token');
      }

      await db.query(
        'INSERT INTO shares (trip_id, share_token) VALUES ($1, $2)',
        [tripId, shareToken]
      );
    }

    const baseUrl = (process.env.PUBLIC_APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const publicUrl = `${baseUrl}/share/${shareToken}`;

    return res.status(201).json({
      shareToken,
      publicUrl
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/trips/:shareToken/copy — clone shared trip into viewer's account (requires auth)
router.post('/:shareToken/copy', authMiddleware, async (req, res, next) => {
  try {
    const { shareToken } = req.params;
    const userId = req.user.userId;

    // Look up original trip from shareToken
    const shareResult = await db.query(
      'SELECT trip_id FROM shares WHERE share_token = $1',
      [shareToken]
    );

    if (shareResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Shared trip not found'
        }
      });
    }

    const originalTripId = shareResult.rows[0].trip_id;
    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [originalTripId]);

    if (tripRes.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Original trip not found'
        }
      });
    }

    const orig = tripRes.rows[0];

    // Clone trip for current user
    const newTripRes = await db.query(
      `INSERT INTO trips (user_id, title, description, start_date, end_date, budget, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, `${orig.title} (Copy)`, orig.description, orig.start_date, orig.end_date, orig.budget, orig.currency]
    );

    const newTripId = newTripRes.rows[0].id;

    // Clone stops & activities
    const stops = await db.query('SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY stop_order ASC', [originalTripId]);
    for (const stop of stops.rows) {
      const newStop = await db.query(
        `INSERT INTO trip_stops (trip_id, city_id, city_name, stop_order, arrival_date, departure_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [newTripId, stop.city_id, stop.city_name, stop.stop_order, stop.arrival_date, stop.departure_date, stop.notes]
      );

      const acts = await db.query('SELECT * FROM itinerary_activities WHERE trip_stop_id = $1', [stop.id]);
      for (const act of acts.rows) {
        await db.query(
          `INSERT INTO itinerary_activities (trip_stop_id, activity_id, title, activity_date, start_time, end_time, order_index, cost, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [newStop.rows[0].id, act.activity_id, act.title, act.activity_date, act.start_time, act.end_time, act.order_index, act.cost, act.notes]
        );
      }
    }

    return res.status(201).json({
      newTripId
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
