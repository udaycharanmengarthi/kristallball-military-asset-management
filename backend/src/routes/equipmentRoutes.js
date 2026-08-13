const express = require("express");
const {
  listEquipmentTypes,
  createEquipmentType,
} = require("../controllers/equipmentController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/rbacMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", listEquipmentTypes);
router.post("/", authorizeRoles("ADMIN", "LOGISTICS_OFFICER"), createEquipmentType);

module.exports = router;
