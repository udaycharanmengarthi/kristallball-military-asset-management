const { AppDataSource } = require("../config/db");
const Base = require("../entities/Base");
const { asyncHandler, ApiError, sendSuccess } = require("../utils/apiHelpers");

const listBases = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Base);

  // Base name/code/location is not sensitive, and every role legitimately
  // needs to see the full list (e.g. a Base Commander must be able to pick
  // a transfer destination). The real RBAC boundary is on the *detailed*
  // single-base and asset/inventory endpoints, not this reference list.
  const bases = await repo.find({ order: { name: "ASC" } });
  return sendSuccess(res, bases);
});

const getBase = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Base);
  const base = await repo.findOne({ where: { id: Number(req.params.id) } });
  if (!base) throw new ApiError(404, "Base not found");

  if (
    req.user.role === "BASE_COMMANDER" &&
    Number(req.user.baseId) !== base.id
  ) {
    throw new ApiError(403, "Access to this base is not permitted");
  }

  return sendSuccess(res, base);
});

const createBase = asyncHandler(async (req, res) => {
  const { name, code, location } = req.body;
  if (!name || !code) throw new ApiError(400, "name and code are required");

  const repo = AppDataSource.getRepository(Base);
  const base = await repo.save(repo.create({ name, code, location }));
  return sendSuccess(res, base, 201);
});

module.exports = { listBases, getBase, createBase };
