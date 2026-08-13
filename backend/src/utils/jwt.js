const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      baseId: user.baseId ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
