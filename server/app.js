const path = require('path');
const { authMiddleware } = require('./middleware/auth');

let app;

try {
  const express = require('express');
  const cors = require('cors');
  const expApp = express();

  const authRouter = require('./routes/auth');
  const usersRouter = require('./routes/users');
  const citiesRouter = require('./routes/cities');
  const shareRouter = require('./routes/share');
  const publicRouter = require('./routes/public');

  expApp.use(cors());
  expApp.use(express.json());

  // Health Checks
  expApp.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  expApp.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Protected route for integration tests
  expApp.get('/api/test-protected', authMiddleware, (req, res) => {
    res.status(200).json({
      message: 'Protected route accessed successfully',
      user: req.user
    });
  });

  // Mount API Routers
  expApp.use('/api/auth', authRouter);
  expApp.use('/api/users', usersRouter);
  expApp.use('/api/cities', citiesRouter);
  expApp.use('/api/trips', shareRouter);
  expApp.use('/api/public', publicRouter);

  // Fallback 404 handler
  expApp.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found'
      }
    });
  });

  // Global Error Handler
  expApp.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred'
      }
    });
  });

  app = expApp;
} catch (e) {
  // Built-in HTTP handler fallback for zero-dependency standalone execution
  app = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        if (body) {
          try { req.body = JSON.parse(body); } catch (err) { req.body = {}; }
        } else {
          req.body = {};
        }

        if (pathname === '/health' || pathname === '/api/health') {
          return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        }

        if (pathname === '/api/test-protected' && req.method === 'GET') {
          return authMiddleware(req, res, () => {
            res.status(200).json({
              message: 'Protected route accessed successfully',
              user: req.user
            });
          });
        }

        if (pathname === '/api/auth/register' && req.method === 'POST') {
          const { validateRegisterInput, generateToken } = require('./utils/auth');
          const { createUser, findUserByEmail } = require('./services/userService');
          const { name, email, password } = req.body;
          const validation = validateRegisterInput({ name, email, password });
          if (!validation.isValid) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.message } });
          }
          const existing = await findUserByEmail(email);
          if (existing) {
            return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'Email is already registered' } });
          }
          const user = await createUser({ name, email, password });
          const token = generateToken({ id: user.id, email: user.email });
          return res.status(201).json({ id: user.id, name: user.name, email: user.email, token });
        }

        if (pathname === '/api/auth/login' && req.method === 'POST') {
          const { validateLoginInput, comparePassword, generateToken } = require('./utils/auth');
          const { findUserByEmail } = require('./services/userService');
          const { email, password } = req.body;
          const validation = validateLoginInput({ email, password });
          if (!validation.isValid) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.message } });
          }
          const user = await findUserByEmail(email);
          if (!user || !comparePassword(password, user.password_hash)) {
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
          }
          const token = generateToken({ id: user.id, email: user.email });
          return res.status(200).json({ id: user.id, name: user.name, email: user.email, token });
        }

        if (pathname === '/api/users/me') {
          return authMiddleware(req, res, async () => {
            const { findUserById, updateUser } = require('./services/userService');
            if (req.method === 'GET') {
              const user = await findUserById(req.user.userId);
              if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
              return res.status(200).json(user);
            }
            if (req.method === 'PUT') {
              const { name, profileImage, profile_image } = req.body;
              if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name cannot be empty' } });
              }
              const user = await updateUser(req.user.userId, { name, profileImage, profile_image });
              if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
              return res.status(200).json(user);
            }
          });
        }

        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found'
          }
        });
      } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected error occurred'
          }
        });
      }
    });
  };
}

module.exports = app;
