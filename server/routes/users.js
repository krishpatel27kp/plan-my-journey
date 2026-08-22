// server/routes/users.js
// Pillar A — Users: Profile & Settings
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// GET /api/users/me (protected)
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({
    id: req.user.userId,
    name: 'Stub Test User',
    email: req.user.email,
    profileImage: null
  });
});

module.exports = router;
