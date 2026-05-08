const express = require("express");
const router = express.Router();
const controller = require("../controllers/routesController");
const { authorizeRoles, verifyToken } = require("../midlewares/authMiddleware");

router.use(verifyToken);

router.get("/", controller.getRoutes);
router.get("/:id", controller.getRouteById);
router.use(authorizeRoles("Admin"));
router.post("/", controller.addRoute);
router.put("/:id", controller.updateRoute);
router.delete("/:id", controller.deleteRoute);

module.exports = router;
