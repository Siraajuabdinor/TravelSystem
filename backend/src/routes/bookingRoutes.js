const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookingController");
const { verifyToken } = require("../midlewares/authMiddleware");

router.use(verifyToken);

router.get("/", controller.getBookings);
router.get("/:id", controller.getBookingById);
router.post("/", controller.addBooking);
router.put("/:id", controller.updateBooking);
router.delete("/:id", controller.deleteBooking);

module.exports = router;
