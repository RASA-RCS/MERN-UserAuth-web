import express from "express";
import { body, param } from "express-validator";
import AuthController from "../controllers/authController.js";
import checkIsUserAuthenticated from "../middlewares/authMiddleware.js";

const router = express.Router();

// -------------------- Async Handler --------------------
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// -------------------- User Authentication --------------------

// Register new user
router.post(
  "/users/register",
  [
    body("Fname").notEmpty().withMessage("First name is required"),
    body("Lname").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  asyncHandler(AuthController.userRegistration)
);

// Email + password login (Step 1: Send OTP)
router.post(
  "/users/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  asyncHandler(AuthController.userLogin)
);

// Verify OTP (Step 2: Complete login)
router.post(
  "/verify-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp")
      .isLength({ min: 4, max: 6 })
      .withMessage("Valid OTP is required"),
  ],
  asyncHandler(AuthController.verifyLoginOtp)
);

// Google login
router.post(
  "/users/google-login",
  [
    body("email").isEmail(),
    body("uid").notEmpty(),
    body("name").notEmpty(),
  ],
  asyncHandler(AuthController.googleLogin)
);

// Facebook login
router.post(
  "/users/facebook-login",
  [
    body("email").isEmail(),
    body("uid").notEmpty(),
    body("name").notEmpty(),
  ],
  asyncHandler(AuthController.facebookLogin)
);

// Forget password (request email)
router.post(
  "/forget-password",
  body("email").isEmail(),
  asyncHandler(AuthController.forgetPassword)
);

// Reset password link
router.post(
  "/forget-password/:id/:token",
  [
    param("id").notEmpty(),
    param("token").notEmpty(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  asyncHandler(AuthController.forgetPasswordEmail)
);

// Email verification
router.get("/verify/:token", asyncHandler(AuthController.saveVerifiedEmail));

// Change password (authenticated)
router.post(
  "/change-password",
  checkIsUserAuthenticated,
  body("oldPassword").notEmpty(),
  body("newPassword").notEmpty(),
  asyncHandler(AuthController.changePassword)
);

// Update last login method (authenticated)
router.post(
  "/update-login-method",
  checkIsUserAuthenticated,
  asyncHandler(async (req, res) => {
    const { loginMethod } = req.body;

    if (!loginMethod) {
      return res.status(400).json({ message: "loginMethod is required" });
    }

    const allowedMethods = ["Email/Password", "Google", "Facebook", "Apple"];
    if (!allowedMethods.includes(loginMethod)) {
      return res.status(400).json({ message: "Invalid loginMethod" });
    }

    const user = await AuthController.updateLoginMethod(req.user._id, loginMethod);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Last login method updated successfully",
      lastLoginMethod: user.lastLoginMethod,
    });
  })
);

// -------------------- Session Management --------------------

// Get current user sessions
router.get(
  "/users/sessions",
  checkIsUserAuthenticated,
  asyncHandler(async (req, res) => {
    const user = await AuthController.getUserSessions(req.user._id);
    res.json(user.sessions || []);
  })
);

// Logout current session
router.delete(
  "/users/logout",
  checkIsUserAuthenticated,
  asyncHandler(AuthController.logoutCurrentSession)
);

// Logout from all devices
router.delete(
  "/users/logout-all",
  checkIsUserAuthenticated,
  asyncHandler(AuthController.logoutAllSessions)
);

// Force logout previous sessions
router.post(
  "/users/forceLogout",
  asyncHandler(AuthController.forceLogout)
);

// Send logout email
router.post(
  "/send-logout-email",
  asyncHandler(AuthController.sendLogoutEmail)
);

export default router;
