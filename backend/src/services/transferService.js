const { AppDataSource } = require("../config/db");
const Asset = require("../entities/Asset");
const Transfer = require("../entities/Transfer");
const { getOrCreateAsset } = require("./inventoryService");
const { recordAudit } = require("./auditService");
const { ApiError } = require("../utils/apiHelpers");

/**
 * Executes a transfer atomically:
 *   BEGIN
 *     validate source balance
 *     decrease source inventory
 *     increase destination inventory
 *     create transfer record
 *     create audit log
 *   COMMIT
 * If any step fails, the whole transaction rolls back and no partial
 * state (e.g. source decremented but destination not credited) is ever
 * persisted.
 */
async function transferAssets({
  sourceBaseId,
  destinationBaseId,
  equipmentTypeId,
  quantity,
  transferDate,
  createdById,
}) {
  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be greater than zero");
  }
  if (Number(sourceBaseId) === Number(destinationBaseId)) {
    throw new ApiError(400, "Source and destination base must be different");
  }

  return AppDataSource.transaction(async (manager) => {
    const assetRepo = manager.getRepository(Asset);

    // Lock the source row for the duration of the transaction to prevent a
    // race between two concurrent transfers from over-drawing the same
    // source inventory.
    const sourceAsset = await assetRepo.findOne({
      where: { baseId: sourceBaseId, equipmentTypeId },
      lock: { mode: "pessimistic_write" },
    });

    if (!sourceAsset || sourceAsset.currentQuantity < quantity) {
      throw new ApiError(409, "Insufficient inventory at source base");
    }

    sourceAsset.currentQuantity -= quantity;
    await assetRepo.save(sourceAsset);

    const destinationAsset = await getOrCreateAsset(destinationBaseId, equipmentTypeId, manager);
    destinationAsset.currentQuantity += quantity;
    await assetRepo.save(destinationAsset);

    const transferRepo = manager.getRepository(Transfer);
    const transfer = await transferRepo.save(
      transferRepo.create({
        sourceBaseId,
        destinationBaseId,
        equipmentTypeId,
        quantity,
        transferDate,
        status: "COMPLETED",
        createdById,
      })
    );

    await recordAudit(
      {
        userId: createdById,
        action: "TRANSFER",
        baseId: sourceBaseId,
        details: `Transferred ${quantity} unit(s) of equipment #${equipmentTypeId} from base #${sourceBaseId} to base #${destinationBaseId}`,
      },
      manager
    );

    return transfer;
  });
}

module.exports = { transferAssets };
