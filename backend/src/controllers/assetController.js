const { AppDataSource } = require("../config/db");
const Asset = require("../entities/Asset");
const { asyncHandler, ApiError, sendSuccess } = require("../utils/apiHelpers");
const { getDashboardMetrics } = require("../services/inventoryService");
const { resolveBaseId } = require("../middlewares/rbacMiddleware");

const listAssets = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Asset);
  const qb = repo
    .createQueryBuilder("asset")
    .leftJoinAndSelect("asset.base", "base")
    .leftJoinAndSelect("asset.equipmentType", "equipmentType");

  // Non-admins are always scoped to their own base regardless of any
  // baseId supplied in the query string (see resolveBaseId).
  const baseId = resolveBaseId(req);
  if (baseId) qb.andWhere("asset.baseId = :baseId", { baseId });

  if (req.query.equipmentTypeId) {
    qb.andWhere("asset.equipmentTypeId = :equipmentTypeId", {
      equipmentTypeId: req.query.equipmentTypeId,
    });
  }

  qb.orderBy("base.name", "ASC").addOrderBy("equipmentType.name", "ASC");

  const assets = await qb.getMany();
  return sendSuccess(res, assets);
});

const getAsset = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Asset);
  const asset = await repo.findOne({
    where: { id: Number(req.params.id) },
    relations: ["base", "equipmentType"],
  });
  if (!asset) throw new ApiError(404, "Asset not found");

  if (req.user.role === "BASE_COMMANDER" && Number(req.user.baseId) !== asset.baseId) {
    throw new ApiError(403, "Access to this base's assets is not permitted");
  }

  return sendSuccess(res, asset);
});

const getAssetMetrics = asyncHandler(async (req, res) => {
  const baseId = resolveBaseId(req);
  const equipmentTypeId = req.query.equipmentTypeId || undefined;
  const { startDate, endDate } = req.query;

  const metrics = await getDashboardMetrics({
    baseId,
    equipmentTypeId: equipmentTypeId ? Number(equipmentTypeId) : undefined,
    startDate,
    endDate,
  });

  return sendSuccess(res, metrics);
});

module.exports = { listAssets, getAsset, getAssetMetrics };
