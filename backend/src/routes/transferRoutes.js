const express = require("express");
const { listTransfers, createTransfer } = require("../controllers/transferController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { authorizeRoles, enforceTransferBaseScope } = require("../middlewares/rbacMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", listTransfers);

// Base Commanders may initiate transfers, but only out of their own base
// (enforced explicitly since a transfer spans two bases).
router.post(
  "/",
  authorizeRoles("ADMIN", "LOGISTICS_OFFICER", "BASE_COMMANDER"),
  enforceTransferBaseScope,
  createTransfer
);

module.exports = router;
