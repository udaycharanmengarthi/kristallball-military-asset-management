const express = require("express");
const { listAssets, getAsset, getAssetMetrics } = require("../controllers/assetController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { enforceBaseScope } = require("../middlewares/rbacMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Static route must be declared before the dynamic ":id" route.
router.get("/metrics", enforceBaseScope, getAssetMetrics);
router.get("/", enforceBaseScope, listAssets);
router.get("/:id", getAsset);

module.exports = router;
