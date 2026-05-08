const express = require("express");
const router = express.Router();
const controller = require("../controllers/tripController");
const { authorizeRoles, verifyToken } = require("../midlewares/authMiddleware");

router.use(verifyToken, authorizeRoles("Admin"));

router.get("/", controller.getTrips);
router.get("/:id", controller.getTripById);
router.post("/", controller.addTrip);
router.put("/:id", controller.updateTrip);
router.delete("/:id", controller.deleteTrip);

module.exports = router;
