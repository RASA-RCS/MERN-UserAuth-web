// ---------------- COPYRIGHT & CONFIDENTIALITY ----------------
//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import mongoose from "mongoose";

// ------------------- Session Schema -------------------
// Represents a single login session for a user (device/browser)
const sessionSchema = new mongoose.Schema({
  token: { type: String, required: true },     // JWT token for session authentication
  userAgent: { type: String },                // Browser/device info
  ip: { type: String },                        // IP address of login
  lastActivity: { type: Date, default: Date.now }, // Last activity timestamp
  expiresAt: { type: Date },                  // Token expiration timestamp
});

// ------------------- User Schema -------------------
// Represents a user account with all authentication, OTP, and session data
const authSchema = new mongoose.Schema({
  // ------------------- Personal Info -------------------
  Fname: { type: String, required: true, trim: true }, // First Name
  Mname: { type: String, trim: true },                 // Middle Name (optional)
  Lname: { type: String, required: true, trim: true }, // Last Name

  phone: {
    type: String,
    match: [/^\d{10}$/, "Phone number must be 10 digits"], // Must be 10 digits
    required: function () {
      return !this.googleId && !this.facebookId; // Required if not using OAuth
    },
  },

  email: { type: String, required: true, unique: true, lowercase: true }, // Email address
  password: {
    type: String,
    required: function () {
      return !this.googleId && !this.facebookId; // Required if not using OAuth
    },
  },

  isVerified: { type: Boolean, default: false }, // Email verification status

  // ------------------- OAuth IDs -------------------
  googleId: { type: String, unique: true, sparse: true },   // Firebase Google UID
  facebookId: { type: String, unique: true, sparse: true }, // Firebase Facebook UID
  photoURL: { type: String },                               // User avatar/photo URL

  // ------------------- OTP Fields -------------------
  loginOtp: { type: Number },      // OTP for login
  loginOtpExpiry: { type: Date },  // Expiration for login OTP
  otp: { type: String },           // General-purpose OTP (e.g., email verification)
  otpExpires: { type: Date },      // Expiration for general OTP

  // ------------------- Security -------------------
  loginAttempts: { type: Number, default: 0 }, // Count of failed login attempts
  lockUntil: { type: Date, default: null },   // Account lock expiration timestamp

  // ------------------- Sessions -------------------
  sessions: { type: [sessionSchema], default: [] }, // Array of login sessions (multiple devices)

  // ------------------- Last Login Method -------------------
  lastLoginMethod: {
    type: String,
    enum: ["Email/Password", "Google", "Facebook", "Apple"], // Allowed login types
    default: "Email/Password",
  },
});

// ------------------- Instance Methods -------------------

// Check if account is currently locked
authSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Remove expired sessions from the sessions array
authSchema.methods.cleanExpiredSessions = function () {
  const now = new Date();
  this.sessions = this.sessions.filter((session) => session.expiresAt > now);
};

// Get number of active sessions (not expired)
authSchema.methods.activeSessionCount = function () {
  const now = new Date();
  return this.sessions.filter((session) => session.expiresAt > now).length;
};

// Keep only the current session (force logout on all other devices)
authSchema.methods.keepSingleDeviceSession = function (currentToken) {
  this.sessions = this.sessions.filter((session) => session.token === currentToken);
};

// ------------------- Pre-save Hook -------------------
// Automatically ensure Fname and Lname are not empty, even for OAuth users
authSchema.pre("save", function (next) {
  if (!this.Fname) this.Fname = "User";         // Default First Name
  if (!this.Lname) this.Lname = "Unknown";      // Default Last Name
  next();
});

// ------------------- Model Export -------------------
const authModel = mongoose.model("User", authSchema);
export default authModel;
