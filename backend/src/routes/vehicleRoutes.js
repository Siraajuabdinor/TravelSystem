const express = require("express");
const router = express.Router();
const controller = require("../controllers/vehicleController");
const { authorizeRoles, verifyToken } = require("../midlewares/authMiddleware");

router.use(verifyToken, authorizeRoles("Admin"));

router.get("/", controller.getVehicles);
router.get("/:id", controller.getVehicleById);
router.post("/", controller.addVehicle);
router.put("/:id", controller.updateVehicle);
router.delete("/:id", controller.deleteVehicle);

module.exports = router;