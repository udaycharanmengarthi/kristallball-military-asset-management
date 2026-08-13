const { AppDataSource } = require("../config/db");
const AuditLog = require("../entities/AuditLog");
const { asyncHandler, sendSuccess } = require("../utils/apiHelpers");
const { resolveBaseId } = require("../middlewares/rbacMiddleware");

const listAuditLogs = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(AuditLog);
  const qb = repo
    .createQueryBuilder("log")
    .leftJoin("log.user", "user")
    .addSelect(["user.id", "user.username", "user.fullName", "user.role"])
    .orderBy("log.createdAt", "DESC")
    .take(200);

  // Admins see everything (optionally filtered). Everyone else only sees
  // logs relevant to their own base or their own actions.
  if (req.user.role !== "ADMIN") {
    qb.andWhere("(log.baseId = :baseId OR log.userId = :userId)", {
      baseId: req.user.baseId,
      userId: req.user.userId,
    });
  } else {
    const baseId = resolveBaseId(req);
    if (baseId) qb.andWhere("log.baseId = :baseId", { baseId });
  }

  if (req.query.action) {
    qb.andWhere("log.action = :action", { action: req.query.action });
  }

  const logs = await qb.getMany();
  return sendSuccess(res, logs);
});

module.exports = { listAuditLogs };
