const { AppDataSource } = require("../config/db");
const Asset = require("../entities/Asset");
const Purchase = require("../entities/Purchase");
const Transfer = require("../entities/Transfer");
const Assignment = require("../entities/Assignment");
const Expenditure = require("../entities/Expenditure");
const { ApiError } = require("../utils/apiHelpers");

/**
 * Finds (or lazily creates) the Asset row tracking current quantity for a
 * given base + equipment type. All inventory-changing operations must go
 * through this so the "single source of truth" balance never drifts.
 */
async function getOrCreateAsset(baseId, equipmentTypeId, manager) {
  const repo = manager.getRepository(Asset);
  let asset = await repo.findOne({ where: { baseId, equipmentTypeId } });
  if (!asset) {
    asset = repo.create({
      baseId,
      equipmentTypeId,
      openingBalance: 0,
      currentQuantity: 0,
      assignedQuantity: 0,
      expendedQuantity: 0,
    });
    asset = await repo.save(asset);
  }
  return asset;
}

async function getAvailableQuantity(baseId, equipmentTypeId) {
  const repo = AppDataSource.getRepository(Asset);
  const asset = await repo.findOne({ where: { baseId, equipmentTypeId } });
  return asset ? asset.currentQuantity : 0;
}

/**
 * Builds a where-clause fragment applying optional filters shared by the
 * dashboard and history endpoints: date range, base, equipment type.
 */
function buildDateRangeFilter(qb, alias, { startDate, endDate }) {
  if (startDate) {
    qb.andWhere(`${alias}.createdAt >= :startDate`, { startDate });
  }
  if (endDate) {
    qb.andWhere(`${alias}.createdAt <= :endDate`, { endDate });
  }
}

/**
 * Aggregates dashboard metrics for the requested scope:
 *   openingBalance, purchases, transfersIn, transfersOut,
 *   netMovement, assigned, expended, closingBalance
 *
 * Scope is optionally narrowed by baseId and/or equipmentTypeId, and the
 * movement totals (purchases/transfers/assigned/expended) are optionally
 * narrowed further by a date range. Opening/closing balances always
 * reflect current running totals on the Asset table (not the date filter),
 * since they represent point-in-time stock levels.
 */
async function getDashboardMetrics({ baseId, equipmentTypeId, startDate, endDate }) {
  const assetRepo = AppDataSource.getRepository(Asset);

  const assetQb = assetRepo.createQueryBuilder("asset");
  if (baseId) assetQb.andWhere("asset.baseId = :baseId", { baseId });
  if (equipmentTypeId) {
    assetQb.andWhere("asset.equipmentTypeId = :equipmentTypeId", { equipmentTypeId });
  }
  const assets = await assetQb.getMany();

  const openingBalance = assets.reduce((sum, a) => sum + a.openingBalance, 0);
  const currentQuantity = assets.reduce((sum, a) => sum + a.currentQuantity, 0);
  const assignedTotal = assets.reduce((sum, a) => sum + a.assignedQuantity, 0);
  const expendedTotal = assets.reduce((sum, a) => sum + a.expendedQuantity, 0);

  const purchaseRepo = AppDataSource.getRepository(Purchase);
  const purchaseQb = purchaseRepo
    .createQueryBuilder("p")
    .select("COALESCE(SUM(p.quantity), 0)", "total");
  if (baseId) purchaseQb.andWhere("p.baseId = :baseId", { baseId });
  if (equipmentTypeId) purchaseQb.andWhere("p.equipmentTypeId = :equipmentTypeId", { equipmentTypeId });
  buildDateRangeFilter(purchaseQb, "p", { startDate, endDate });
  const purchasesRow = await purchaseQb.getRawOne();

  const transferRepo = AppDataSource.getRepository(Transfer);

  const transfersInQb = transferRepo
    .createQueryBuilder("t")
    .select("COALESCE(SUM(t.quantity), 0)", "total")
    .andWhere("t.status = 'COMPLETED'");
  if (baseId) transfersInQb.andWhere("t.destinationBaseId = :baseId", { baseId });
  if (equipmentTypeId) transfersInQb.andWhere("t.equipmentTypeId = :equipmentTypeId", { equipmentTypeId });
  buildDateRangeFilter(transfersInQb, "t", { startDate, endDate });
  const transfersInRow = await transfersInQb.getRawOne();

  const transfersOutQb = transferRepo
    .createQueryBuilder("t")
    .select("COALESCE(SUM(t.quantity), 0)", "total")
    .andWhere("t.status = 'COMPLETED'");
  if (baseId) transfersOutQb.andWhere("t.sourceBaseId = :baseId", { baseId });
  if (equipmentTypeId) transfersOutQb.andWhere("t.equipmentTypeId = :equipmentTypeId", { equipmentTypeId });
  buildDateRangeFilter(transfersOutQb, "t", { startDate, endDate });
  const transfersOutRow = await transfersOutQb.getRawOne();

  const assignmentRepo = AppDataSource.getRepository(Assignment);
  const assignmentQb = assignmentRepo
    .createQueryBuilder("a")
    .select("COALESCE(SUM(a.quantity), 0)", "total");
  if (baseId) assignmentQb.andWhere("a.baseId = :baseId", { baseId });
  if (equipmentTypeId) assignmentQb.andWhere("a.equipmentTypeId = :equipmentTypeId", { equipmentTypeId });
  buildDateRangeFilter(assignmentQb, "a", { startDate, endDate });
  const assignmentsRow = await assignmentQb.getRawOne();

  const expenditureRepo = AppDataSource.getRepository(Expenditure);
  const expenditureQb = expenditureRepo
    .createQueryBuilder("e")
    .select("COALESCE(SUM(e.quantity), 0)", "total");
  if (baseId) expenditureQb.andWhere("e.baseId = :baseId", { baseId });
  if (equipmentTypeId) expenditureQb.andWhere("e.equipmentTypeId = :equipmentTypeId", { equipmentTypeId });
  buildDateRangeFilter(expenditureQb, "e", { startDate, endDate });
  const expendituresRow = await expenditureQb.getRawOne();

  const purchases = Number(purchasesRow.total);
  const transfersIn = Number(transfersInRow.total);
  const transfersOut = Number(transfersOutRow.total);
  const assignedInRange = Number(assignmentsRow.total);
  const expendedInRange = Number(expendituresRow.total);

  const netMovement = purchases + transfersIn - transfersOut;

  // closingBalance is defined against the period's movement:
  //   openingBalance + netMovement - assigned - expended
  // When no date filter is supplied this reconciles exactly with the
  // live running balance (currentQuantity) on the Asset table.
  const closingBalance = openingBalance + netMovement - assignedInRange - expendedInRange;

  return {
    openingBalance,
    purchases,
    transfersIn,
    transfersOut,
    netMovement,
    assigned: assignedInRange,
    expended: expendedInRange,
    closingBalance,
    currentQuantity,
    assignedTotal,
    expendedTotal,
  };
}

async function addPurchase({ baseId, equipmentTypeId, quantity, purchaseDate, createdById }, manager) {
  if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than zero");

  const asset = await getOrCreateAsset(baseId, equipmentTypeId, manager);
  asset.currentQuantity += quantity;
  await manager.getRepository(Asset).save(asset);

  const purchaseRepo = manager.getRepository(Purchase);
  return purchaseRepo.save(
    purchaseRepo.create({ baseId, equipmentTypeId, quantity, purchaseDate, createdById })
  );
}

async function assignAssets(
  { baseId, equipmentTypeId, quantity, assignee, assignmentDate, createdById },
  manager
) {
  if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than zero");

  const asset = await getOrCreateAsset(baseId, equipmentTypeId, manager);
  if (asset.currentQuantity < quantity) {
    throw new ApiError(409, "Insufficient inventory to assign");
  }
  asset.currentQuantity -= quantity;
  asset.assignedQuantity += quantity;
  await manager.getRepository(Asset).save(asset);

  const repo = manager.getRepository(Assignment);
  return repo.save(
    repo.create({ baseId, equipmentTypeId, quantity, assignee, assignmentDate, createdById })
  );
}

async function recordExpenditure(
  { baseId, equipmentTypeId, quantity, reason, expenditureDate, createdById },
  manager
) {
  if (quantity <= 0) throw new ApiError(400, "Quantity must be greater than zero");

  const asset = await getOrCreateAsset(baseId, equipmentTypeId, manager);
  if (asset.currentQuantity < quantity) {
    throw new ApiError(409, "Insufficient inventory to expend");
  }
  asset.currentQuantity -= quantity;
  asset.expendedQuantity += quantity;
  await manager.getRepository(Asset).save(asset);

  const repo = manager.getRepository(Expenditure);
  return repo.save(
    repo.create({ baseId, equipmentTypeId, quantity, reason, expenditureDate, createdById })
  );
}

module.exports = {
  getOrCreateAsset,
  getAvailableQuantity,
  getDashboardMetrics,
  addPurchase,
  assignAssets,
  recordExpenditure,
};
