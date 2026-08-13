const express = require("express");
const { listAuditLogs } = require("../controllers/auditController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Scoping (admin sees all, others see only relevant records) is handled
// inside the controller since "relevant" here means "by base OR by self",
// which enforceBaseScope's single-field override can't express.
router.get("/", listAuditLogs);

module.exports = router;
