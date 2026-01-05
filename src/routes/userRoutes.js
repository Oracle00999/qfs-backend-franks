const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, admin } = require("../middleware/auth");

// Admin only routes
router.get("/", protect, admin, userController.getAllUsers);
router.get("/:id", protect, admin, userController.getUserById);
router.put("/:id/status", protect, admin, userController.updateUserStatus);
router.get("/:id/wallet", protect, admin, userController.getUserWallet);

module.exports = router;
