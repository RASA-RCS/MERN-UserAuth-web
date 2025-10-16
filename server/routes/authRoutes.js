// ---------------- COPYRIGHT & CONFIDENTIALITY ----------------
//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import express from "express";
import { body, param } from "express-validator"; // For request body and param validation
import AuthController from "../controllers/authController.js"; // All user authentication logic
import checkIsUserAuthenticated from "../middlewares/authMiddleware.js"; // JWT authentication middleware

const router = express.Router();

// -------------------- Async Handler --------------------
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// -------------------- User Authentication --------------------

// 1️⃣ Register new user
router.post(
  "/users/register",
  [
      body("Fname").notEmpty().withMessage("First name is required"), // Validate first name
    body("Lname").notEmpty().withMessage("Last name is required"),  // Validate last name
    body("email").isEmail().withMessage("Valid email is required"), // Validate email format
    body("password").notEmpty().withMessage("Password is required"), // Validate password
  ],
  asyncHandler(AuthController.userRegistration) // Controller handles actual registration logic
);

// 2️⃣ Email + password login (Step 1: Send OTP)
router.post(
  "/users/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  asyncHandler(AuthController.userLogin)   // Controller sends OTP for login
);

// 3️⃣ Verify OTP (Step 2: Complete login)
router.post(
  "/verify-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp")
      .isLength({ min: 4, max: 6 })
      .withMessage("Valid OTP is required"),
  ],
  asyncHandler(AuthController.verifyLoginOtp)   // Controller verifies OTP and logs in user
);

// 4️⃣ Google login
router.post(
  "/users/google-login",
  [
    body("email").isEmail(),   // User email
    body("uid").notEmpty(),    // Google UID from Firebase
    body("name").notEmpty(),   // Full name
  ],
  asyncHandler(AuthController.googleLogin)
);

// 5️⃣ Facebook login
router.post(
  "/users/facebook-login",
  [
    body("email").isEmail(),
    body("uid").notEmpty(),    // Facebook UID
    body("name").notEmpty(),
  ],
  asyncHandler(AuthController.facebookLogin)
);

// 6️⃣ Forget password (request reset email)
router.post(
  "/forget-password",
  body("email").isEmail(),
  asyncHandler(AuthController.forgetPassword)
);

// 7️⃣ Reset password via link (with user ID & token)
router.post(
  "/forget-password/:id/:token",
  [
    param("id").notEmpty(),             // User ID from URL
    param("token").notEmpty(),          // Reset token from URL
    body("password").notEmpty().withMessage("Password is required"), // New password
  ],
  asyncHandler(AuthController.forgetPasswordEmail)
);

// 8️⃣ Email verification link
router.get("/verify/:token", asyncHandler(AuthController.saveVerifiedEmail));

// 9️⃣ Change password (authenticated)
router.post(
  "/change-password",
  checkIsUserAuthenticated,            // Middleware to verify JWT and get user
  body("oldPassword").notEmpty(),      // Current password
  body("newPassword").notEmpty(),      // New password
  asyncHandler(AuthController.changePassword)
);

//  🔟 Update last login method (authenticated)
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

// 1️⃣ Get current user sessions
router.get(
  "/users/sessions",
  checkIsUserAuthenticated,
  asyncHandler(async (req, res) => {
    const user = await AuthController.getUserSessions(req.user._id);
    res.json(user.sessions || []);
  })
);

// 2️⃣ Logout current session
router.delete(
  "/users/logout",
  checkIsUserAuthenticated,
  asyncHandler(AuthController.logoutCurrentSession)
);

// 3️⃣ Logout from all devices
router.delete(
  "/users/logout-all",
  checkIsUserAuthenticated,
  asyncHandler(AuthController.logoutAllSessions)
);

// 4️⃣ Force logout previous sessions
router.post(
  "/users/forceLogout",
  asyncHandler(AuthController.forceLogout)
);

// 5️⃣ Send logout notification email
router.post(
  "/send-logout-email",
  asyncHandler(AuthController.sendLogoutEmail)
);

export default router;
