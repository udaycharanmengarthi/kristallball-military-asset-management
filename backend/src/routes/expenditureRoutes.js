const express = require("express");
const { listExpenditures, createExpenditure } = require("../controllers/expenditureController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { authorizeRoles, enforceBaseScope } = require("../middlewares/rbacMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", enforceBaseScope, listExpenditures);

// Logistics Officers have LIMITED access to expenditures (view only, per
// the RBAC matrix) - not included among the roles allowed to create.
router.post(
  "/",
  authorizeRoles("ADMIN", "BASE_COMMANDER"),
  enforceBaseScope,
  createExpenditure
);

module.exports = router;
