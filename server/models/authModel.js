import mongoose from "mongoose";

// ------------------- Session Schema -------------------
const sessionSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userAgent: { type: String },    // browser/device info
  ip: { type: String },           // login IP
  lastActivity: { type: Date, default: Date.now },
  expiresAt: { type: Date },      // token expiration
});

// ------------------- User Schema -------------------
const authSchema = new mongoose.Schema({
  Fname: { type: String, required: true, trim: true },
  Mname: { type: String,  trim: true },
  Lname: { type: String, required: true, trim: true },
  phone: {
    type: String,
    match: [/^\d{10}$/, "Phone number must be 10 digits"],
    required: function () {
      return !this.googleId && !this.facebookId; // required if not OAuth
    },
  },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: {
    type: String,
    required: function () {
      return !this.googleId && !this.facebookId; // required if not OAuth
    },
  },
  isVerified: { type: Boolean, default: false },

  // ------------------- OAuth IDs -------------------
  googleId: { type: String, unique: true, sparse: true },   // Firebase Google UID
  facebookId: { type: String, unique: true, sparse: true }, // Firebase Facebook UID
  photoURL: { type: String },

  // ------------------- OTP fields -------------------
  loginOtp: { type: Number },
  loginOtpExpiry: { type: Date },
  otp: { type: String },
  otpExpires: { type: Date },

  // ------------------- Security -------------------
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  // ------------------- Sessions -------------------
  sessions: { type: [sessionSchema], default: [] },  // multiple sessions (devices)

  // ------------------- Last Login Method -------------------
  lastLoginMethod: {
    type: String,
    enum: ["Email/Password", "Google", "Facebook", "Apple"],
    default: "Email/Password",
  },
});

// ------------------- Instance Methods -------------------

//Check if account is locked
authSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

//  Remove expired sessions
authSchema.methods.cleanExpiredSessions = function () {
  const now = new Date();
  this.sessions = this.sessions.filter((session) => session.expiresAt > now);
};

//  Get active session count
authSchema.methods.activeSessionCount = function () {
  const now = new Date();
  return this.sessions.filter((session) => session.expiresAt > now).length;
};

//  Force logout all other devices (except current token)
authSchema.methods.keepSingleDeviceSession = function (currentToken) {
  this.sessions = this.sessions.filter((session) => session.token === currentToken);
};

// ------------------- Pre-save Hook -------------------
// Automatically trim Fname and Lname, ensure no empty strings for OAuth users
authSchema.pre("save", function (next) {
  if (!this.Fname) this.Fname = "User";
  if (!this.Lname) this.Lname = "Unknown";
  next();
});

const authModel = mongoose.model("User", authSchema);
export default authModel;
