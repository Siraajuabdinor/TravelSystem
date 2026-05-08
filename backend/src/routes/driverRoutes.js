const express = require("express");
const router = express.Router();
const controller = require("../controllers/driverController");
const { authorizeRoles, verifyToken } = require("../midlewares/authMiddleware");

router.use(verifyToken, authorizeRoles("Admin"));

router.get("/", controller.getDrivers);
router.get("/:id", controller.getDriverById);
router.post("/", controller.addDriver);
router.put("/:id", controller.updateDriver);
router.delete("/:id", controller.deleteDriver);

module.exports = router;
