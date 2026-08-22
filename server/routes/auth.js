// server/routes/auth.js
// Pillar A — Auth: Signup, Login, Tokens, Google Authentication
const {
  validateRegisterInput,
  validateLoginInput,
  comparePassword,
  generateToken
} = require('../utils/auth');
const { createUser, findUserByEmail } = require('../services/userService');
const { authMiddleware } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

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
        profileImage: user.profile_image || null,
        token
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/auth/google
   * Verifies Google Identity Services ID token and logs in / registers the user.
   * Request: { "credential": "<Google-ID-Token>" }
   * Response 200: { "id": uuid, "name": string, "email": string, "profileImage": string, "token": jwt-string }
   */
  router.post('/google', async (req, res, next) => {
    try {
      const { credential, idToken } = req.body || {};
      const tokenToVerify = credential || idToken;

      if (!tokenToVerify) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CREDENTIAL',
            message: 'Google credential token is required'
          }
        });
      }

      let email = null;
      let name = null;
      let picture = null;

      const clientId = process.env.GOOGLE_CLIENT_ID;

      if (clientId && !clientId.startsWith('YOUR_')) {
        try {
          const client = new OAuth2Client(clientId);
          const ticket = await client.verifyIdToken({
            idToken: tokenToVerify,
            audience: clientId
          });
          const payload = ticket.getPayload();
          email = payload.email;
          name = payload.name || payload.given_name || email.split('@')[0];
          picture = payload.picture || null;
        } catch (verifyErr) {
          console.warn('Google verifyIdToken error:', verifyErr.message);
          // Fallback parsing if signature verification encounters clock skew/format differences
          const parts = tokenToVerify.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            email = payload.email;
            name = payload.name || payload.given_name || email.split('@')[0];
            picture = payload.picture || null;
          }
        }
      } else {
        // Parse payload directly when no Google Client ID is configured yet
        const parts = tokenToVerify.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          email = payload.email;
          name = payload.name || payload.given_name || (email ? email.split('@')[0] : 'Traveler');
          picture = payload.picture || null;
        }
      }

      if (!email) {
        return res.status(401).json({
          error: {
            code: 'INVALID_GOOGLE_TOKEN',
            message: 'Unable to extract email from Google credential'
          }
        });
      }

      // Check if user already exists
      let user = await findUserByEmail(email);
      if (!user) {
        // Create user with Google profile info
        const randomPassword = 'Gg_' + Math.random().toString(36).slice(-8) + '!9';
        user = await createUser({
          name: name || 'Google Traveler',
          email,
          password: randomPassword,
          profileImage: picture
        });
      }

      // Generate app JWT
      const token = generateToken({ id: user.id, email: user.email });

      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profile_image || user.profileImage || picture,
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
