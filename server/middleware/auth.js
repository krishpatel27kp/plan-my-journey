/**
 * Auth Middleware STUB (Phase 0)
 * 
 * Teammates B & C will build against this stub immediately.
 * In Phase 1, this will be replaced with real JWT verification.
 */

const STUB_TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InRlc3R1c2VyQHBsYW5teWpvdXJuZXkuZGV2IiwiaWF0IjoxNzQwMDAwMDAwLCJleHAiOjE3NzE1MzYwMDB9.stub-signature-phase0-teammate-a";

const FAKE_USER = {
  userId: "11111111-1111-1111-1111-111111111111",
  email: "testuser@planmyjourney.dev"
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers ? (req.headers.authorization || req.headers.Authorization) : null;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "No authorization header provided"
      }
    });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid authorization header format. Expected 'Bearer <token>'"
      }
    });
  }

  const token = parts[1];

  if (token !== STUB_TEST_TOKEN) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token"
      }
    });
  }

  // Attach stub user payload to request
  req.user = { ...FAKE_USER };
  if (next) next();
}

module.exports = {
  authMiddleware,
  STUB_TEST_TOKEN,
  FAKE_USER
};
