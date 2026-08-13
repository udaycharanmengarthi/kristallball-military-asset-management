const { AppDataSource } = require("../config/db");
const AuditLog = require("../entities/AuditLog");

/**
 * Writes an audit record. Accepts an optional TypeORM EntityManager (tx) so
 * that, when called from inside a transaction (e.g. transferService), the
 * audit row commits or rolls back atomically with the rest of the mutation.
 */
async function recordAudit({ userId, action, baseId = null, details }, manager) {
  const repo = manager
    ? manager.getRepository(AuditLog)
    : AppDataSource.getRepository(AuditLog);

  return repo.save(repo.create({ userId, action, baseId, details }));
}

module.exports = { recordAudit };
