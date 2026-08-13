const express = require("express");
const { listPurchases, createPurchase } = require("../controllers/purchaseController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { authorizeRoles, enforceBaseScope } = require("../middlewares/rbacMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", enforceBaseScope, listPurchases);

// Base Commanders may record purchases, but only for their own base
// (enforceBaseScope rewrites req.body.baseId to their assigned base).
router.post(
  "/",
  authorizeRoles("ADMIN", "LOGISTICS_OFFICER", "BASE_COMMANDER"),
  enforceBaseScope,
  createPurchase
);

module.exports = router;
