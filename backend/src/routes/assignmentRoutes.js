const express = require("express");
const { listAssignments, createAssignment } = require("../controllers/assignmentController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { authorizeRoles, enforceBaseScope } = require("../middlewares/rbacMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", enforceBaseScope, listAssignments);

// Logistics Officers have LIMITED access to assignments (view only, per the
// RBAC matrix) - they are not included among the roles allowed to create.
router.post(
  "/",
  authorizeRoles("ADMIN", "BASE_COMMANDER"),
  enforceBaseScope,
  createAssignment
);

module.exports = router;
