const bcrypt = require("bcrypt");
const { AppDataSource } = require("../config/db");
const User = require("../entities/User");
const { signToken } = require("../utils/jwt");
const { asyncHandler, ApiError, sendSuccess } = require("../utils/apiHelpers");
const { recordAudit } = require("../services/auditService");

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { username } });

  // Same generic message for "no such user" and "wrong password" so we
  // never leak which one was incorrect.
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid username or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid username or password");
  }

  const token = signToken(user);

  await recordAudit({
    userId: user.id,
    action: "LOGIN",
    baseId: user.baseId,
    details: `User ${user.username} logged in`,
  });

  return sendSuccess(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      baseId: user.baseId,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: req.user.userId } });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sendSuccess(res, {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    baseId: user.baseId,
  });
});

module.exports = { login, me };
