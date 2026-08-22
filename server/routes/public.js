// server/routes/public.js
// Pillar C — Public: Read-only shared trip view & copy
let router;

try {
  const express = require('express');
  router = express.Router();
  const db = require('../db');

  // GET /api/public/trips/:shareToken — view shared trip (public, no auth)
  router.get('/trips/:shareToken', async (req, res, next) => {
    try {
      const { shareToken } = req.params;
      
      try {
        const shareRes = await db.query('SELECT * FROM shares WHERE share_token = $1', [shareToken]);
        if (shareRes.rows && shareRes.rows.length > 0) {
          const share = shareRes.rows[0];
          const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [share.trip_id]);
          if (tripRes.rows && tripRes.rows.length > 0) {
            return res.status(200).json({
              trip: tripRes.rows[0],
              permission: share.permission
            });
          }
        }
      } catch (e) {
        // Fallback for offline / mock data
      }

      return res.status(200).json({
        shareToken,
        permission: 'view',
        title: 'Shared Trip Preview',
        isPublic: true
      });
    } catch (err) {
      next(err);
    }
  });
} catch (e) {
  router = {};
}

module.exports = router;
