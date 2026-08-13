const { AppDataSource } = require("../config/db");
const Base = require("../entities/Base");
const {
  asyncHandler,
  ApiError,
  sendSuccess,
} = require("../utils/apiHelpers");

/*
 * GET /api/bases
 *
 * IMPORTANT:
 * Return ALL bases.
 *
 * A Base Commander needs to see other base names
 * so they can select a destination for transfers.
 *
 * Detailed access to another base is still restricted
 * by getBase() below.
 */
const listBases = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Base);

  const bases = await repo.find({
    order: {
      name: "ASC",
    },
  });

  res.set("Cache-Control", "no-store");

  return sendSuccess(res, bases);
});

/*
 * GET /api/bases/:id
 *
 * Base Commander can only access their assigned base.
 * Admin and Logistics Officer can access other bases.
 */
const getBase = asyncHandler(async (req, res) => {
  const repo = AppDataSource.getRepository(Base);

  const baseId = Number(req.params.id);

  if (!Number.isInteger(baseId)) {
    throw new ApiError(400, "Invalid base ID");
  }

  const base = await repo.findOne({
    where: {
      id: baseId,
    },
  });

  if (!base) {
    throw new ApiError(404, "Base not found");
  }

  if (
    req.user.role === "BASE_COMMANDER" &&
    Number(req.user.baseId) !== Number(base.id)
  ) {
    throw new ApiError(
      403,
      "Access to this base is not permitted"
    );
  }

  return sendSuccess(res, base);
});

/*
 * POST /api/bases
 *
 * Admin only through baseRoutes.js.
 */
const createBase = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    location,
  } = req.body;

  if (!name || !code) {
    throw new ApiError(
      400,
      "name and code are required"
    );
  }

  const repo = AppDataSource.getRepository(Base);

  const base = await repo.save(
    repo.create({
      name,
      code,
      location,
    })
  );

  return sendSuccess(res, base, 201);
});

module.exports = {
  listBases,
  getBase,
  createBase,
};