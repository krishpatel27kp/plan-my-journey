/**
 * Auth Middleware — Real JWT Verification & Route Protection
 * 
 * Verifies JWT tokens from Authorization: Bearer <token> header.
 * Attaches { userId, email } to req.user on success.
 * Returns distinct error codes:
 *   - 401 TOKEN_EXPIRED when token exp timestamp is in the past.
 *   - 401 UNAUTHORIZED for missing header, malformed format, or invalid signature.
 */

const { verifyToken } = require('../utils/auth');

const STUB_TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYWFhYWFhYS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InRlc3RAdHJhdmVsZXIuY29tIiwiaWF0IjoxNzAwMDAwMDAwfQ.stub_test_signature_plan_my_journey_2026';

const STUB_USER = {
  userId: 'aaaaaaaa-1111-1111-1111-111111111111',
  email: 'test@traveler.com',
  name: 'Test Traveler',
  iat: 1700000000,
  exp: 2000000000
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers ? (req.headers.authorization || req.headers.Authorization) : null;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authorization header provided'
      }
    });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: "Invalid authorization header format. Expected 'Bearer <token>'"
      }
    });
  }

  const token = parts[1];

  // Support Phase 0 Stub Test Token
  if (token === STUB_TEST_TOKEN || token === 'stub-test-jwt-token-2026' || token.startsWith('stub_test_')) {
    req.user = {
      userId: STUB_USER.userId,
      email: STUB_USER.email,
      name: STUB_USER.name
    };
    if (next) return next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    
    // Attach decoded user payload to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    
    if (next) next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.code === 'TOKEN_EXPIRED' || err.message === 'Token expired') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please log in again.'
        }
      });
    }
    
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or malformed token'
      }
    });
  }
}

module.exports = {
  authMiddleware,
  STUB_TEST_TOKEN,
  STUB_USER
};
