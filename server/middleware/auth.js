/**
 * Auth Middleware — Real JWT Verification
 * 
 * Verifies JWT tokens from Authorization: Bearer <token> header.
 * Attaches { userId, email } to req.user on success.
 * Rejects invalid/expired/missing tokens with standard error shape.
 */

const { verifyToken } = require('../utils/auth');

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

  try {
    const decoded = verifyToken(token);
    
    // Attach decoded user payload to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    
    if (next) next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid or expired token'
      }
    });
  }
}

module.exports = {
  authMiddleware
};
