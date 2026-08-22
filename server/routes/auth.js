// server/routes/auth.js
// Pillar A — Auth: Signup, Login, Tokens
const {
  validateRegisterInput,
  validateLoginInput,
  comparePassword,
  generateToken
} = require('../utils/auth');
const { createUser, findUserByEmail } = require('../services/userService');
const { authMiddleware } = require('../middleware/auth');

let router;
try {
  const express = require('express');
  router = express.Router();

  /**
   * POST /api/auth/register
   * Request: { "name": string, "email": string, "password": string }
   * Response 201: { "id": uuid, "name": string, "email": string, "token": jwt-string }
   */
  router.post('/register', async (req, res, next) => {
    try {
      const { name, email, password } = req.body || {};

      // Validate Input
      const validation = validateRegisterInput({ name, email, password });
      if (!validation.isValid) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.message
          }
        });
      }

      // Check if email already exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email is already registered'
          }
        });
      }

      // Create user in database (password is hashed before saving)
      const newUser = await createUser({ name, email, password });

      // Generate JWT token
      const token = generateToken({ id: newUser.id, email: newUser.email });

      return res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        token
      });
    } catch (err) {
      if (err.code === 'EMAIL_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email is already registered'
          }
        });
      }
      next(err);
    }
  });

  /**
   * POST /api/auth/login
   * Request: { "email": string, "password": string }
   * Response 200: { "id": uuid, "name": string, "email": string, "token": jwt-string }
   */
  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body || {};

      // Validate Input
      const validation = validateLoginInput({ email, password });
      if (!validation.isValid) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.message
          }
        });
      }

      // Lookup user
      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Verify Password Hash
      const isMatch = comparePassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Generate JWT token
      const token = generateToken({ id: user.id, email: user.email });

      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        token
      });
    } catch (err) {
      next(err);
    }
  });
} catch (e) {
  router = {};
}

module.exports = router;
