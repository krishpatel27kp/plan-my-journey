// server/routes/public.js
// Pillar C — Public: Read-only shared trip view & copy
// Phase 0 scaffold — empty router skeleton
//
// Planned endpoints (Phase 2+):
//   GET  /api/public/trips/:shareToken — view shared trip (public, no auth)
//   POST /api/trips/:shareToken/copy   — clone shared trip into viewer's account (requires auth, Phase 3)

const express = require('express');
const router = express.Router();

// TODO: Phase 2 — implement GET /api/public/trips/:shareToken (no auth)
// TODO: Phase 3 — implement POST /api/trips/:shareToken/copy (requires auth)

module.exports = router;
