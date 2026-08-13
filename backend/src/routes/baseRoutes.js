const express = require("express");
const { listBases, getBase, createBase } = require("../controllers/baseController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/rbacMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", listBases);
router.get("/:id", getBase);
router.post("/", authorizeRoles("ADMIN"), createBase);

module.exports = router;
