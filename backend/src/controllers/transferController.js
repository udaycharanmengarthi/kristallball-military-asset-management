const { AppDataSource } = require("../config/db");
const Transfer = require("../entities/Transfer");
const { asyncHandler, ApiError, sendSuccess } = require("../utils/apiHelpers");
const { transferAssets } = require("../services/transferService");
const { resolveBaseId } = require("../middlewares/rbacMiddleware");

const listTransfers = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Transfer);
  const qb = repo
    .createQueryBuilder("transfer")
    .leftJoinAndSelect("transfer.sourceBase", "sourceBase")
    .leftJoinAndSelect("transfer.destinationBase", "destinationBase")
    .leftJoinAndSelect("transfer.equipmentType", "equipmentType")
    .leftJoin("transfer.createdBy", "createdBy")
    .addSelect(["createdBy.id", "createdBy.username", "createdBy.fullName", "createdBy.role"])
    .orderBy("transfer.createdAt", "DESC");

  // Non-admins may only see transfers touching their own base, either as
  // source or destination. resolveBaseId ignores any client-supplied
  // baseId for non-admins, so this can't be spoofed via the query string.
  const baseId = resolveBaseId(req);
  if (baseId) {
    qb.andWhere(
      "(transfer.sourceBaseId = :baseId OR transfer.destinationBaseId = :baseId)",
      { baseId }
    );
  }

  if (req.query.equipmentTypeId) {
    qb.andWhere("transfer.equipmentTypeId = :equipmentTypeId", {
      equipmentTypeId: req.query.equipmentTypeId,
    });
  }
  if (req.query.startDate) {
    qb.andWhere("transfer.createdAt >= :startDate", { startDate: req.query.startDate });
  }
  if (req.query.endDate) {
    qb.andWhere("transfer.createdAt <= :endDate", { endDate: req.query.endDate });
  }

  const transfers = await qb.getMany();
  return sendSuccess(res, transfers);
});

const createTransfer = asyncHandler(async (req, res) => {
  const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity, transferDate } = req.body;

  if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !quantity || !transferDate) {
    throw new ApiError(
      400,
      "sourceBaseId, destinationBaseId, equipmentTypeId, quantity and transferDate are required"
    );
  }

  const transfer = await transferAssets({
    sourceBaseId: Number(sourceBaseId),
    destinationBaseId: Number(destinationBaseId),
    equipmentTypeId: Number(equipmentTypeId),
    quantity: Number(quantity),
    transferDate,
    createdById: req.user.userId,
  });

  return sendSuccess(res, transfer, 201);
});

module.exports = { listTransfers, createTransfer };
