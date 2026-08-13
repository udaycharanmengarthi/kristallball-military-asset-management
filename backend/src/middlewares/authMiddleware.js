const { verifyToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiHelpers");

/**
 * Verifies the Bearer JWT on every protected request and attaches the
 * decoded claims to req.user as { userId, role, baseId }.
 */
function authenticateToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication token missing"));
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      baseId: decoded.baseId ?? null,
    };
    return next();
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

module.exports = { authenticateToken };
