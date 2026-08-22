const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/:stopId/activities', authMiddleware, async (req, res, next) => {
  try {
    const { stopId } = req.params;
    const { activityId, date, startTime, endTime, cost = 0 } = req.body || {};
    const stop = await db.query(`SELECT s.id, s.city_id FROM trip_stops s JOIN trips t ON t.id = s.trip_id WHERE s.id = $1 AND t.user_id = $2`, [stopId, req.user.userId]);
    if (!stop.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Stop not found' } });
    if (!activityId || !date) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'activityId and date are required' } });
    const activity = await db.query('SELECT id, name, category FROM activities WHERE id = $1 AND city_id = $2', [activityId, stop.rows[0].city_id]);
    if (!activity.rows.length) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Activity must belong to the stop city' } });
    if (Number.isNaN(Number(cost)) || Number(cost) < 0) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Cost must be a non-negative number' } });
    const order = await db.query('SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM itinerary_activities WHERE trip_stop_id = $1', [stopId]);
    const result = await db.query(`INSERT INTO itinerary_activities (id, trip_stop_id, activity_id, title, activity_date, start_time, end_time, order_index, cost) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`, [crypto.randomUUID(), stopId, activityId, activity.rows[0].name, date, startTime || null, endTime || null, Number(order.rows[0].next_order), Number(cost)]);
    const row = result.rows[0];
    return res.status(201).json({ id: row.id, activityId: row.activity_id, title: row.title, category: activity.rows[0].category, date: row.activity_date, startTime: row.start_time, endTime: row.end_time, cost: Number(row.cost) || 0 });
  } catch (err) { next(err); }
});

module.exports = router;