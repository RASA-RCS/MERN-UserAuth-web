// ---------------- COPYRIGHT & CONFIDENTIALITY ----------------
//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import jwt from "jsonwebtoken"; // Import JWT library for token verification
import authModel from "../models/authModel.js"; // Import Mongoose model for authentication

/**
 * Middleware: checkIsUserAuthenticated
 * Purpose: Verifies that a request comes from an authenticated user.
 * Steps:
 * 1. Checks for Bearer token in the Authorization header
 * 2. Verifies JWT token validity
 * 3. Fetches user from DB and excludes password field
 * 4. Checks if the token exists in the user's active sessions
 * 5. Cleans up inactive sessions older than 3 minutes
 * 6. Attaches user object and token to req for next middleware
 * 7. Returns 401 error if unauthorized
 */
const checkIsUserAuthenticated = async (req, res, next) => {
  let token; // Variable to store the extracted JWT token
  const { authorization } = req.headers; // Get Authorization header from request

  // ---------------- Check if Authorization header exists and starts with "Bearer" ----------------
  if (authorization && authorization.startsWith("Bearer")) {
    try {
      // Extract token from header
      token = authorization.split(" ")[1];

      // ---------------- Verify token ----------------
      // 'amarjeetKumar' is the secret key used to sign the JWT (should be stored in ENV for production)
      const { userID } = jwt.verify(token, "amarjeetKumar");

      // ---------------- Get user from DB ----------------
      // Exclude password field for security
      const user = await authModel.findById(userID).select("-password");
      if (!user) return res.status(401).json({ message: "User not found" });

      // ---------------- Check if token exists in user's active sessions ----------------
      // Supports multiple login methods: Email, Google, Facebook
      const sessionExists = user.sessions.some(sess => sess.token === token);
      if (!sessionExists) {
        return res.status(401).json({ message: "Session expired or invalid" });
      }

      // ---------------- Remove inactive sessions ----------------
      // Only keep sessions with activity within the last 5 minutes (300000 ms)
      user.sessions = user.sessions.filter(sess => {
        const inactiveTime = Date.now() - new Date(sess.lastActivity).getTime();
        return inactiveTime <= 5 * 60 * 1000; // 5 minutes
      });
      await user.save(); // Save updated sessions

      // ---------------- Attach user & token to request ----------------
      req.user = user;  // Available to next middleware or route handler
      req.token = token; // JWT token available for further use
      next(); // Pass control to next middleware
    } catch (error) {
      // Catch JWT verification errors or DB errors
      return res.status(401).json({ message: "unAuthorized User" });
    }
  } else {
    // Authorization header missing or malformed
    return res.status(401).json({ message: "unAuthorized User" });
  }
};

// Export middleware function
export default checkIsUserAuthenticated;
