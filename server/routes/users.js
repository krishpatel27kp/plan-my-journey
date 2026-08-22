// server/routes/users.js
// Pillar A — Users: Profile & Settings
const { authMiddleware } = require('../middleware/auth');
const { findUserById, updateUser } = require('../services/userService');

let router;
try {
  const express = require('express');
  router = express.Router();

  /**
   * GET /api/users/me
   * Auth: Bearer JWT
   * Response 200: { "id": uuid, "name": string, "email": string, "profileImage": url|null }
   */
  router.get('/me', authMiddleware, async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const user = await findUserById(userId);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'User profile not found'
          }
        });
      }

      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || null
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PUT /api/users/me
   * Auth: Bearer JWT
   * Request: { "name"?: string, "profileImage"?: string|null, "profile_image"?: string|null }
   * Response 200: { "id": uuid, "name": string, "email": string, "profileImage": url|null }
   */
  router.put('/me', authMiddleware, async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { name, profileImage, profile_image } = req.body || {};

      // Validate name if provided
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Name cannot be empty'
            }
          });
        }
      }

      const updated = await updateUser(userId, { name, profileImage, profile_image });
      if (!updated) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      return res.status(200).json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        profileImage: updated.profileImage || null
      });
    } catch (err) {
      next(err);
    }
  });
} catch (e) {
  router = {};
}

module.exports = router;
