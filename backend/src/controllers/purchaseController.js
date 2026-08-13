const { AppDataSource } = require("../config/db");
const Purchase = require("../entities/Purchase");
const { asyncHandler, ApiError, sendSuccess } = require("../utils/apiHelpers");
const { addPurchase } = require("../services/inventoryService");
const { recordAudit } = require("../services/auditService");
const { resolveBaseId } = require("../middlewares/rbacMiddleware");

const listPurchases = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Purchase);
  const qb = repo
    .createQueryBuilder("purchase")
    .leftJoinAndSelect("purchase.base", "base")
    .leftJoinAndSelect("purchase.equipmentType", "equipmentType")
    .leftJoin("purchase.createdBy", "createdBy")
    .addSelect(["createdBy.id", "createdBy.username", "createdBy.fullName", "createdBy.role"])
    .orderBy("purchase.createdAt", "DESC");

  const baseId = resolveBaseId(req);
  if (baseId) qb.andWhere("purchase.baseId = :baseId", { baseId });
  if (req.query.equipmentTypeId) {
    qb.andWhere("purchase.equipmentTypeId = :equipmentTypeId", {
      equipmentTypeId: req.query.equipmentTypeId,
    });
  }
  if (req.query.startDate) {
    qb.andWhere("purchase.createdAt >= :startDate", { startDate: req.query.startDate });
  }
  if (req.query.endDate) {
    qb.andWhere("purchase.createdAt <= :endDate", { endDate: req.query.endDate });
  }

  const purchases = await qb.getMany();
  return sendSuccess(res, purchases);
});

const createPurchase = asyncHandler(async (req, res) => {
  const { baseId, equipmentTypeId, quantity, purchaseDate } = req.body;

  if (!baseId || !equipmentTypeId || !quantity || !purchaseDate) {
    throw new ApiError(400, "baseId, equipmentTypeId, quantity and purchaseDate are required");
  }
  if (Number(quantity) <= 0) {
    throw new ApiError(400, "Quantity must be greater than zero");
  }

  const purchase = await AppDataSource.transaction(async (manager) => {
    const created = await addPurchase(
      {
        baseId: Number(baseId),
        equipmentTypeId: Number(equipmentTypeId),
        quantity: Number(quantity),
        purchaseDate,
        createdById: req.user.userId,
      },
      manager
    );

    await recordAudit(
      {
        userId: req.user.userId,
        action: "PURCHASE",
        baseId: Number(baseId),
        details: `Purchased ${quantity} unit(s) of equipment #${equipmentTypeId} for base #${baseId}`,
      },
      manager
    );

    return created;
  });

  return sendSuccess(res, purchase, 201);
});

module.exports = { listPurchases, createPurchase };
