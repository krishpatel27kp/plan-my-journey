// server/routes/share.js
// Pillar C — Sharing: Share token generation & Copy Trip (requires auth)
// Phase 2 & Phase 3 implementation

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

// POST /api/trips/:shareToken/copy — Transactional deep-clone of shared trip into viewer's account (requires auth)
router.post('/:shareToken/copy', authMiddleware, async (req, res, next) => {
  let client;
  try {
    const { shareToken } = req.params;
    const userId = req.user.userId;

    if (!shareToken || typeof shareToken !== 'string') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Shared trip not found or link has expired'
        }
      });
    }

    client = await db.connect();
    await client.query('BEGIN');

    // 1. Look up share token and check expiration
    const shareResult = await client.query(
      'SELECT trip_id, expires_at FROM shares WHERE share_token = $1',
      [shareToken]
    );

    if (shareResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Shared trip not found or link has expired'
        }
      });
    }

    const shareRow = shareResult.rows[0];
    if (shareRow.expires_at && new Date(shareRow.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Shared trip not found or link has expired'
        }
      });
    }

    const originalTripId = shareRow.trip_id;

    // 2. Fetch original trip details
    const tripRes = await client.query('SELECT * FROM trips WHERE id = $1', [originalTripId]);
    if (tripRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Original trip not found'
        }
      });
    }

    const orig = tripRes.rows[0];
    const newTitle = orig.title.startsWith('Copy of ') ? orig.title : `Copy of ${orig.title}`;

    // 3. Insert newly cloned trip row owned by current user
    const newTripRes = await client.query(
      `INSERT INTO trips (user_id, title, description, start_date, end_date, cover_image, budget, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId,
        newTitle,
        orig.description,
        orig.start_date,
        orig.end_date,
        orig.cover_image,
        orig.budget,
        orig.currency || 'USD',
        'planning'
      ]
    );

    const newTripId = newTripRes.rows[0].id;

    // 4. Fetch and clone all trip stops
    const stopsRes = await client.query(
      'SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY stop_order ASC',
      [originalTripId]
    );

    for (const stop of stopsRes.rows) {
      const newStopRes = await client.query(
        `INSERT INTO trip_stops (trip_id, city_id, city_name, stop_order, arrival_date, departure_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          newTripId,
          stop.city_id,
          stop.city_name,
          stop.stop_order,
          stop.arrival_date,
          stop.departure_date,
          stop.notes
        ]
      );

      const newStopId = newStopRes.rows[0].id;

      // 5. Fetch and clone all itinerary activities for this stop
      const actsRes = await client.query(
        'SELECT * FROM itinerary_activities WHERE trip_stop_id = $1 ORDER BY order_index ASC',
        [stop.id]
      );

      for (const act of actsRes.rows) {
        await client.query(
          `INSERT INTO itinerary_activities (trip_stop_id, activity_id, title, activity_date, start_time, end_time, order_index, cost, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            newStopId,
            act.activity_id,
            act.title,
            act.activity_date,
            act.start_time,
            act.end_time,
            act.order_index,
            act.cost,
            act.notes,
            act.status || 'planned'
          ]
        );
      }
    }

    // 6. Commit transaction
    await client.query('COMMIT');

    return res.status(201).json({
      newTripId
    });
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
    }
    next(err);
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
