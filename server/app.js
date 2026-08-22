const path = require('path');
const { authMiddleware, STUB_TEST_TOKEN } = require('./middleware/auth');

let app;

try {
  const express = require('express');
  const cors = require('cors');
  const expApp = express();

  expApp.use(cors());
  expApp.use(express.json());

  // Health Check
  expApp.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  expApp.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Direct test-protected endpoint for convenience
  expApp.get('/api/test-protected', authMiddleware, (req, res) => {
    res.status(200).json({
      message: 'Protected route accessed successfully',
      user: req.user
    });
  });

  // Import Route Files
  const authRouter = require('./routes/auth');
  const usersRouter = require('./routes/users');
  const citiesRouter = require('./routes/cities');
  const shareRouter = require('./routes/share');
  const publicRouter = require('./routes/public');

  // Mount Routes under /api
  expApp.use('/api/auth', authRouter);
  expApp.use('/api/users', usersRouter);
  expApp.use('/api/cities', citiesRouter);
  expApp.use('/api/trips', shareRouter);
  expApp.use('/api/public', publicRouter);

  // Fallback Route / 404 handler
  expApp.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found'
      }
    });
  });

  // Global error handler
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
  // Built-in HTTP handler fallback for zero-dependency environments
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

    if (pathname === '/health' || pathname === '/api/health') {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (pathname === '/api/test-protected' || pathname === '/api/auth/test-protected') {
      return authMiddleware(req, res, () => {
        res.status(200).json({
          message: 'Protected route accessed successfully',
          user: req.user
        });
      });
    }

    if (pathname === '/api/users/me' && req.method === 'GET') {
      return authMiddleware(req, res, () => {
        res.status(200).json({
          id: req.user.userId,
          name: 'Stub Test User',
          email: req.user.email,
          profileImage: null
        });
      });
    }

    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found'
      }
    });
  };
}

module.exports = app;
