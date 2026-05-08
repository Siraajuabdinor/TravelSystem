const express = require("express");
const router = express.Router();
const controller = require("../controllers/cityController");
const { authorizeRoles, verifyToken } = require("../midlewares/authMiddleware");

router.use(verifyToken);

// Any authenticated user can read cities (needed for booking form route labels)
router.get("/", controller.getCities);
router.get("/:id", controller.getCityById);

// Only admins can create, update, or delete cities
router.use(authorizeRoles("Admin"));
router.post("/", controller.addCity);
router.put("/:id", controller.updateCity);
router.delete("/:id", controller.deleteCity);
router.delete("/", controller.deleteAllCities);

module.exports = router;