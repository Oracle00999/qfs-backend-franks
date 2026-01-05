const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require("../utils/validators");

// Public routes
router.post("/register", validate(registerValidation), authController.register);
router.post(
  "/register-admin",
  validate(registerValidation),
  authController.registerAdmin
);
router.post("/login", validate(loginValidation), authController.login);
// router.post('/login', validate(loginValidation), authController.login);

// Protected routes
router.get("/me", protect, authController.getMe);
router.put(
  "/me",
  protect,
  validate(updateProfileValidation),
  authController.updateProfile
);
router.put(
  "/change-password",
  protect,
  validate(changePasswordValidation),
  authController.changePassword
);
router.post("/logout", protect, authController.logout);

module.exports = router;
