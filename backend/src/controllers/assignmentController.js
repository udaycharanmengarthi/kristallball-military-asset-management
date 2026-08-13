const { AppDataSource } = require("../config/db");
const Assignment = require("../entities/Assignment");
const { asyncHandler, ApiError, sendSuccess } = require("../utils/apiHelpers");
const { assignAssets } = require("../services/inventoryService");
const { recordAudit } = require("../services/auditService");
const { resolveBaseId } = require("../middlewares/rbacMiddleware");

const listAssignments = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Assignment);
  const qb = repo
    .createQueryBuilder("assignment")
    .leftJoinAndSelect("assignment.base", "base")
    .leftJoinAndSelect("assignment.equipmentType", "equipmentType")
    .leftJoin("assignment.createdBy", "createdBy")
    .addSelect(["createdBy.id", "createdBy.username", "createdBy.fullName", "createdBy.role"])
    .orderBy("assignment.createdAt", "DESC");

  const baseId = resolveBaseId(req);
  if (baseId) qb.andWhere("assignment.baseId = :baseId", { baseId });
  if (req.query.equipmentTypeId) {
    qb.andWhere("assignment.equipmentTypeId = :equipmentTypeId", {
      equipmentTypeId: req.query.equipmentTypeId,
    });
  }

  const assignments = await qb.getMany();
  return sendSuccess(res, assignments);
});

const createAssignment = asyncHandler(async (req, res) => {
  const { baseId, equipmentTypeId, quantity, assignee, assignmentDate } = req.body;

  if (!baseId || !equipmentTypeId || !quantity || !assignee || !assignmentDate) {
    throw new ApiError(
      400,
      "baseId, equipmentTypeId, quantity, assignee and assignmentDate are required"
    );
  }

  const assignment = await AppDataSource.transaction(async (manager) => {
    const created = await assignAssets(
      {
        baseId: Number(baseId),
        equipmentTypeId: Number(equipmentTypeId),
        quantity: Number(quantity),
        assignee,
        assignmentDate,
        createdById: req.user.userId,
      },
      manager
    );

    await recordAudit(
      {
        userId: req.user.userId,
        action: "ASSIGNMENT",
        baseId: Number(baseId),
        details: `Assigned ${quantity} unit(s) of equipment #${equipmentTypeId} to ${assignee}`,
      },
      manager
    );

    return created;
  });

  return sendSuccess(res, assignment, 201);
});

module.exports = { listAssignments, createAssignment };
