// server/routes/public.js
// Pillar C — Public: Read-only shared trip view
// Phase 2 implementation — GET /api/public/trips/:shareToken (no auth required)

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/public/trips/:shareToken — View shared trip (public, no auth required)
router.get('/trips/:shareToken', async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    if (!shareToken || typeof shareToken !== 'string') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Shared trip not found or link has expired'
        }
      });
    }

    // Look up share token and join trip
    const shareResult = await db.query(
      `SELECT s.share_token, s.expires_at, t.id AS trip_id, t.title, t.budget, t.start_date
       FROM shares s
       JOIN trips t ON s.trip_id = t.id
       WHERE s.share_token = $1`,
      [shareToken]
    );

    if (shareResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Shared trip not found or link has expired'
        }
      });
    }

    const shareRow = shareResult.rows[0];

    // Check expiration if set
    if (shareRow.expires_at && new Date(shareRow.expires_at) < new Date()) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Shared trip not found or link has expired'
        }
      });
    }

    const tripId = shareRow.trip_id;

    // Fetch trip stops
    const stopsResult = await db.query(
      `SELECT 
         ts.id AS stop_id,
         ts.city_name,
         c.name AS city_ref_name,
         ts.arrival_date,
         ts.departure_date,
         ts.stop_order
       FROM trip_stops ts
       LEFT JOIN cities c ON ts.city_id = c.id
       WHERE ts.trip_id = $1
       ORDER BY ts.stop_order ASC, ts.arrival_date ASC`,
      [tripId]
    );

    // Fetch activities associated with the stops of this trip
    const activitiesResult = await db.query(
      `SELECT 
         ia.trip_stop_id,
         ia.title,
         ia.cost,
         a.name AS activity_ref_name
       FROM itinerary_activities ia
       LEFT JOIN activities a ON ia.activity_id = a.id
       JOIN trip_stops ts ON ia.trip_stop_id = ts.id
       WHERE ts.trip_id = $1
       ORDER BY ia.order_index ASC, ia.start_time ASC`,
      [tripId]
    );

    // Calculate total cost from all activities (or fallback to trip budget if activities have no cost)
    let totalCost = 0;
    activitiesResult.rows.forEach(act => {
      if (act.cost) {
        totalCost += parseFloat(act.cost) || 0;
      }
    });

    if (totalCost === 0 && shareRow.budget) {
      totalCost = parseFloat(shareRow.budget) || 0;
    }

    // Format stops to strictly match contract Section 2
    const stops = stopsResult.rows.map(stop => {
      const cityName = stop.city_name || stop.city_ref_name || 'Destination';
      
      // Format startDate (YYYY-MM-DD)
      let startDateStr = '';
      if (stop.arrival_date) {
        const d = new Date(stop.arrival_date);
        startDateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(stop.arrival_date);
      } else if (shareRow.start_date) {
        const d = new Date(shareRow.start_date);
        startDateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(shareRow.start_date);
      }

      // Format activities as array of strings (names) per Section 2
      const stopActivities = activitiesResult.rows
        .filter(act => act.trip_stop_id === stop.stop_id)
        .map(act => act.title || act.activity_ref_name)
        .filter(Boolean);

      return {
        city: cityName,
        startDate: startDateStr,
        activities: stopActivities
      };
    });

    return res.status(200).json({
      title: shareRow.title,
      stops: stops,
      totalCost: Math.round(totalCost * 100) / 100
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
