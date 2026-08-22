// server/routes/auth.js
// Pillar A — Auth: Signup, Login, Tokens
const express = require('express');
const router = express.Router();
const { authMiddleware, STUB_TEST_TOKEN } = require('../middleware/auth');

// Phase 0 stub test route
router.get('/test-protected', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Protected route accessed successfully',
    user: req.user
  });
});

module.exports = router;
