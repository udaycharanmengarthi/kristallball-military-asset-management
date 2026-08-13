const { AppDataSource } = require("../config/db");
const Expenditure = require("../entities/Expenditure");
const { asyncHandler, ApiError, sendSuccess } = require("../utils/apiHelpers");
const { recordExpenditure } = require("../services/inventoryService");
const { recordAudit } = require("../services/auditService");
const { resolveBaseId } = require("../middlewares/rbacMiddleware");

const listExpenditures = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Expenditure);
  const qb = repo
    .createQueryBuilder("expenditure")
    .leftJoinAndSelect("expenditure.base", "base")
    .leftJoinAndSelect("expenditure.equipmentType", "equipmentType")
    .leftJoin("expenditure.createdBy", "createdBy")
    .addSelect(["createdBy.id", "createdBy.username", "createdBy.fullName", "createdBy.role"])
    .orderBy("expenditure.createdAt", "DESC");

  const baseId = resolveBaseId(req);
  if (baseId) qb.andWhere("expenditure.baseId = :baseId", { baseId });
  if (req.query.equipmentTypeId) {
    qb.andWhere("expenditure.equipmentTypeId = :equipmentTypeId", {
      equipmentTypeId: req.query.equipmentTypeId,
    });
  }

  const expenditures = await qb.getMany();
  return sendSuccess(res, expenditures);
});

const createExpenditure = asyncHandler(async (req, res) => {
  const { baseId, equipmentTypeId, quantity, reason, expenditureDate } = req.body;

  if (!baseId || !equipmentTypeId || !quantity || !reason || !expenditureDate) {
    throw new ApiError(
      400,
      "baseId, equipmentTypeId, quantity, reason and expenditureDate are required"
    );
  }

  const expenditure = await AppDataSource.transaction(async (manager) => {
    const created = await recordExpenditure(
      {
        baseId: Number(baseId),
        equipmentTypeId: Number(equipmentTypeId),
        quantity: Number(quantity),
        reason,
        expenditureDate,
        createdById: req.user.userId,
      },
      manager
    );

    await recordAudit(
      {
        userId: req.user.userId,
        action: "EXPENDITURE",
        baseId: Number(baseId),
        details: `Expended ${quantity} unit(s) of equipment #${equipmentTypeId}: ${reason}`,
      },
      manager
    );

    return created;
  });

  return sendSuccess(res, expenditure, 201);
});

module.exports = { listExpenditures, createExpenditure };
