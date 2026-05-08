const express = require("express");
const router = express.Router();
const controller = require("../controllers/vehicleDriverController");
const { authorizeRoles, verifyToken } = require("../midlewares/authMiddleware");

router.use(verifyToken, authorizeRoles("Admin"));

router.get("/", controller.getVehicleDrivers);
router.get("/:id", controller.getVehicleDriverById);
router.post("/", controller.addVehicleDriver);
router.put("/:id", controller.updateVehicleDriver);
router.delete("/:id", controller.deleteVehicleDriver);

module.exports = router;
