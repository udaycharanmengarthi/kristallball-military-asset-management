const { AppDataSource } = require("../config/db");
const EquipmentType = require("../entities/EquipmentType");
const { asyncHandler, ApiError, sendSuccess } = require("../utils/apiHelpers");
const { recordAudit } = require("../services/auditService");

const listEquipmentTypes = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(EquipmentType);
  const types = await repo.find({ order: { name: "ASC" } });
  return sendSuccess(res, types);
});

const createEquipmentType = asyncHandler(async (req, res) => {
  const { name, category, unit } = req.body;
  if (!name) throw new ApiError(400, "name is required");

  const repo = AppDataSource.getRepository(EquipmentType);
  const type = await repo.save(repo.create({ name, category, unit }));

  await recordAudit({
    userId: req.user.userId,
    action: "CREATE_EQUIPMENT",
    details: `Created equipment type "${type.name}"`,
  });

  return sendSuccess(res, type, 201);
});

module.exports = { listEquipmentTypes, createEquipmentType };
