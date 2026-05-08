const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const { authorizeRoles, verifyToken } = require("../midlewares/authMiddleware");

router.use(verifyToken, authorizeRoles("Admin"));

router.get("/", controller.getUsers);
router.get("/:id", controller.getUserById);
router.post("/", controller.addUser);
router.put("/:id", controller.updateUser);
router.delete("/:id", controller.deleteUser);

module.exports = router;
