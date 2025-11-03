//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//  with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

// Import the User authentication model (Mongoose schema for users)
import authModel from "../models/authModel.js";

// Import nodemailer to send emails from Node.js
import nodemailer from "nodemailer";

// Import bcryptjs to hash and compare passwords securely
import bcryptjs from "bcryptjs";

// Import jsonwebtoken to create and verify JWT tokens
import jwt from "jsonwebtoken";

// Import custom function to send emails to users
import { sendEmailtoUser } from "../config/EmailTemplate.js";



// ---------------- Helper: Send OTP ----------------
const sendOtpEmail = async (email, otp) => {
  // Create a transporter object using Gmail SMTP
  // This object will handle sending emails
  const transport = nodemailer.createTransport({
    service: "gmail", // Using Gmail as email service provider
    auth: {
      user: process.env.EMAIL, // Sender email address from environment variables
      pass: process.env.EMAIL_PASSWORD, // Sender email password from environment variables
    },
  });

 // Define the email options
  const mailOptions = {
    from: process.env.EMAIL, // Sender email address
    to: email, // Recipient email address
    subject: "Your Login OTP Code", // Subject of the email
    text: `Your OTP for login is: ${otp}. It is valid for 5 minutes.`, // Plain text version of the email
    html: `<p>Your OTP for login is:</p><h2>${otp}</h2><p>It will expire in 5 minutes.</p>`, // HTML version of the email
  };

  // Send the email using the transporter
  // This returns a promise, so we await it
  await transport.sendMail(mailOptions);
};

class authController {

// -------------------- User Registration --------------------

/**
 * Registers a new user.
 * Validates required fields, hashes password, generates verification token,
 * sends email verification link, and saves user to database.
 *
 */
static userRegistration = async (req, res) => {
  // Destructure incoming user data from request body
  const { Fname, Mname, Lname, phone, email, password } = req.body;

  try {
    // -------------------- Required Field Validation --------------------
    // Middle name (Mname) is optional, others are required
    if (Fname && Lname && phone && email && password) {
      
      // Check if a user with the same email already exists in DB
      const isUser = await authModel.findOne({ email: email });
      if (isUser) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        // -------------------- Password Hashing --------------------
        const genSalt = await bcryptjs.genSalt(10); // Generate salt for hashing
        const hashedPassword = await bcryptjs.hash(password, genSalt); // Hash the password

        // -------------------- Token Generation --------------------
        const secretKey = "amarjeetGupta"; // Secret key for JWT
        const token = jwt.sign({ email: email }, secretKey, {
          expiresIn: "10m", // Token expires in 10 minutes
        });

        // -------------------- Verification Link --------------------
        const link = `http://localhost:9000/api/auth/verify/${token}`; // Construct verification link
        sendEmailtoUser(link, email); // Send verification email

        // -------------------- Save New User --------------------
        const newUser = authModel({
          Fname,                   // First Name
          Mname: Mname || "",      // Middle Name (optional)
          Lname,                   // Last Name
          phone,                   // Phone number
          email,                   // Email
          password: hashedPassword, // Store hashed password
          isVerified: false,       // User is not verified until email confirmation
        });

        // Save the user to database
        const resUser = await newUser.save();

        if (resUser) {
          // Return success response
          return res.status(201).json({
            message: "Registered Successfully. Please verify your email",
            user: resUser,
          });
        }
      }
    } else {
      // If required fields are missing, return error
      return res.status(400).json({ message: "All required fields are mandatory" });
    }
  } catch (error) {
    // Catch and return any errors
    return res.status(400).json({ message: error.message });
  }
};


 
// -------------------- Logout Email Notification --------------------

/**
 * Sends a logout notification email to the user.
 * Notifies the user that their account has been successfully logged out.
 *
 */
static sendLogoutEmail = async (req, res) => {
  // Destructure email and name from request body
  const { email, name } = req.body;

  // -------------------- Validation --------------------
  // Ensure email is provided
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // -------------------- Create Transporter --------------------
    // Using nodemailer to send email
    const transporter = nodemailer.createTransport({
      service: "gmail", // Email service provider
      
      auth: {
        user: process.env.EMAIL,          // Sender email (from environment variable)
        pass: process.env.EMAIL_PASSWORD, // Email password (from environment variable)
      },
    });

    // -------------------- Configure Email --------------------
    const mailOptions = {
      from: process.env.EMAIL,           // Sender email
      to: email,                         // Recipient email
      subject: "Logout Successful",      // Email subject line
      text: `Hello ${name || "User"},\nYour account has been logged out successfully.`, // Plain text version
      html: `<p>Hello <strong>${name || "User"}</strong>,</p>
             <p>Your account has been <strong>logged out successfully</strong>.</p>`, // HTML version
    };

    // -------------------- Send Email --------------------
    await transporter.sendMail(mailOptions); // Send the email

    console.log(`✅ Logout email sent successfully for: ${email}`); // Log success
    return res.status(200).json({ success: true, message: "Logout email sent" }); // Respond to client

  } catch (error) {
    // -------------------- Error Handling --------------------
    console.error("❌ Error sending logout email:", error); // Log the error
    return res.status(500).json({ success: false, message: "Failed to send email" }); // Respond with failure
  }
};



// -------------------- Facebook Login --------------------

/**
 * Handles Facebook login for users.
 * If user exists, updates Facebook ID and last login method.
 * If user does not exist, creates a new user with Facebook credentials.
 * Generates JWT token and manages sessions.
 */
static facebookLogin = async (req, res) => {
  try {
    // -------------------- Destructure request body --------------------
    const { uid, email, name, photoURL } = req.body;

    // Validate Facebook data
    if (!uid || !email) 
      return res.status(400).json({ message: "Invalid Facebook data" });

    // -------------------- Find existing user --------------------
    let user = await authModel.findOne({ email });

    // -------------------- Create new user if not exists --------------------
    if (!user) {
      // Split full name into first and last names
      const [Fname, ...rest] = name?.split(" ") || ["User"];
      const Lname = rest.length ? rest.join(" ") : "Unknown";

      // Create new user document
      user = new authModel({
        Fname,                // First name
        Lname,                // Last name
        email,                // User email
        facebookId: uid,      // Facebook UID
        photoURL,             // Profile picture URL
        isVerified: true,     // Automatically verified via OAuth
        sessions: [],         // Initialize empty sessions array
        lastLoginMethod: "Facebook", // Record last login method
      });
    } else {
      // -------------------- Update existing user --------------------
      user.facebookId = uid;              // Update Facebook UID
      user.lastLoginMethod = "Facebook";  // Update last login method
    }

    // Save user to database
    await user.save();

    // -------------------- Generate JWT Token --------------------
    const token = jwt.sign(
      { userID: user._id },       // Payload
      "amarjeetKumar",            // Secret key (should be moved to env variable)
      { expiresIn: "2d" }         // Token expiration
    );

    // -------------------- Single-device enforcement --------------------
    // If user already has an active session, force logout
    if (user.activeSessionCount() > 0) {
      return res.status(200).json({ forceLogout: true, token });
    }

    // -------------------- Add current session --------------------
    user.sessions.push({
      token,                                   // JWT token for this session
      userAgent: req.headers["user-agent"],    // Browser / device info
      ip: req.ip,                               // Client IP address
      lastActivity: new Date(),                // Timestamp of session creation
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days expiry
    });

    // Save updated user with session
    await user.save();

    // -------------------- Response --------------------
    return res.status(200).json({ token, user });

  } catch (error) {
    // -------------------- Error Handling --------------------
    return res.status(500).json({ message: error.message });
  }
};


// -------------------- Google Login --------------------

/**
 * Handles Google login for users.
 * If user exists, updates Google ID and last login method.
 * If user does not exist, creates a new user with Google credentials.
 * Generates JWT token and manages sessions.
 */
static googleLogin = async (req, res) => {
  // -------------------- Destructure request body --------------------
  const { uid, email, name, photoURL } = req.body;

  // Validate Google data
  if (!email || !uid) 
    return res.status(400).json({ message: "Invalid Google data" });

  try {
    // -------------------- Find existing user --------------------
    let user = await authModel.findOne({ email });

    // -------------------- Create new user if not exists --------------------
    if (!user) {
      // Split full name into first and last names
      const [Fname, ...rest] = name?.split(" ") || ["User"];
      const Lname = rest.length ? rest.join(" ") : "Unknown";

      // Create new user document
      user = new authModel({
        Fname,                // First name
        Lname,                // Last name
        email,                // User email
        googleId: uid,        // Google UID
        photoURL,             // Profile picture URL
        lastLoginMethod: "Google", // Record last login method
        isVerified: true,     // Automatically verified via OAuth
        sessions: [],         // Initialize empty sessions array
      });
    } else {
      // -------------------- Update existing user --------------------
      user.googleId = uid;              // Update Google UID
      user.lastLoginMethod = "Google";  // Update last login method
    }

    // Save user to database
    await user.save();

    // -------------------- Generate JWT Token --------------------
    const token = jwt.sign(
      { userID: user._id },      // Payload contains user ID
      "amarjeetKumar",           // Secret key (should be stored in env variable)
      { expiresIn: "2d" }        // Token valid for 2 days
    );

    // -------------------- Single-device enforcement --------------------
    // If user already has any active session, force logout
    if (user.sessions.length > 0) {
      return res.status(200).json({ forceLogout: true, token });
    }

    // -------------------- Add current session --------------------
    user.sessions.push({
      token,                                   // JWT token for this session
      userAgent: req.headers["user-agent"],    // Browser / device info
      ip: req.ip,                               // Client IP address
      lastActivity: new Date(),                // Timestamp of session creation
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days expiry
    });

    // Save updated user with new session
    await user.save();

    // -------------------- Response --------------------
    return res.status(200).json({ token, user });

  } catch (error) {
    // -------------------- Error Handling --------------------
    return res.status(500).json({ message: error.message });
  }
};



 // -------------------- Email Login: Step 1 - Send OTP --------------------

/**
 * Handles email + password login (Step 1).
 * Validates user credentials, checks account lock, generates OTP, and sends it via email.

 */
static userLogin = async (req, res) => {
  // -------------------- Destructure request body --------------------
  const { email, password } = req.body;

  try {
    // -------------------- Validate input --------------------
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // -------------------- Find user by email --------------------

    
    const user = await authModel.findOne({ email });
    if (!user) 
      return res.status(400).json({ message: "User not registered!" });

    // -------------------- Check email verification --------------------
    if (!user.isVerified)
      return res.status(400).json({ message: "Email verification pending" });

    // -------------------- Check account lock --------------------
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({ 
        message: `Too many failed attempts. Your account is temporarily locked for ${minutesLeft} min.` 
      });
    }

    // -------------------- Password validation --------------------
    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account if too many failed attempts
      if (user.loginAttempts >= 4) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }

      await user.save();
      return res.status(400).json({ 
        message: `Invalid credentials! (${user.loginAttempts || 0}/5 attempts)` 
      });
    }

    // -------------------- Update last login method --------------------
    user.lastLoginMethod = "Email/Password";
    await user.save();

    // -------------------- Reset login attempts --------------------
    user.loginAttempts = 0;
    user.lockUntil = null;

    // -------------------- Generate OTP --------------------
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    user.loginOtp = otp;                                      // Store OTP
    user.loginOtpExpiry = Date.now() + 5 * 60 * 1000;         // OTP valid for 5 minutes
    user.loginAttempts = 0;                                   // Reset login attempts
    await user.save();

    // -------------------- Send OTP via email --------------------
    await sendOtpEmail(email, otp);

    // -------------------- Response --------------------
    return res.status(200).json({ otpSent: true, email: user.email });

  } catch (error) {
    // -------------------- Error handling --------------------
    return res.status(500).json({ message: error.message });
  }
};


 // -------------------- Verify OTP: Step 2 - Complete Login --------------------

/**
 * Handles OTP verification for email login (Step 2).
 * Validates OTP, clears it upon success, creates JWT, and manages sessions.

 */
static verifyLoginOtp = async (req, res) => {
  // -------------------- Destructure request body --------------------
  const { email, otp } = req.body;

  try {
    // -------------------- Validate input --------------------
    if (!email || !otp) 
      return res.status(400).json({ message: "Email and OTP are required" });

    // -------------------- Find user by email --------------------
    const user = await authModel.findOne({ email });
    if (!user) 
      return res.status(400).json({ message: "User not found" });

    // -------------------- Check if OTP was requested --------------------
    if (!user.loginOtp || !user.loginOtpExpiry)
      return res.status(400).json({ message: "OTP not requested" });

    // -------------------- Check if OTP is expired --------------------
    if (Date.now() > new Date(user.loginOtpExpiry).getTime())
      return res.status(400).json({ message: "OTP expired" });

    // -------------------- Validate OTP --------------------
    if (otp.toString() !== user.loginOtp.toString())
      return res.status(400).json({ message: "Invalid OTP" });

    // -------------------- Clear OTP fields --------------------
    user.loginOtp = null;
    user.loginOtpExpiry = null;

    // -------------------- Generate JWT token --------------------
    const token = jwt.sign(
      { userID: user._id }, 
      "amarjeetKumar",               // Secret key
      { expiresIn: "2d" }            // Token valid for 2 days
    );

    // -------------------- Device enforcement: remove expired sessions --------------------
    user.sessions = user.sessions.filter(
      sess => new Date(sess.expiresAt) > new Date()  // keep only active sessions
    );

    // -------------------- Force logout if other active sessions exist --------------------
    if (user.sessions.length > 0) {
      return res.status(200).json({ forceLogout: true, token });
    }

    // -------------------- Add current session --------------------
    user.sessions.push({
      token,                                       // JWT token
      userAgent: req.headers["user-agent"],       // Device/browser info
      ip: req.ip,                                 // Login IP
      lastActivity: new Date(),                   // Timestamp of activity
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days expiry
    });

    // -------------------- Save user with new session --------------------
    await user.save();

    // -------------------- Response: return token and basic user info --------------------
    return res.json({ 
      token, 
      user: { Fname: user.Fname, email: user.email }, 
      lastLoginMethod: user.lastLoginMethod 
    });

  } catch (error) {
    // -------------------- Error handling --------------------
    return res.status(500).json({ message: error.message });
  }
};


  // -------------------- Force Logout Previous Session --------------------

/**
 * Logs out all previous sessions for a user and creates a fresh session.
 * Useful for enforcing single-device login.

 */
static forceLogout = async (req, res) => {
  // -------------------- Destructure request body --------------------
  const { token, email } = req.body; // 'token' = new JWT token, 'email' = user's email

  try {
    // -------------------- Find user by email --------------------
    const user = await authModel.findOne({ email });
    if (!user) 
      return res.status(400).json({ message: "User not found" });

    // -------------------- Clear all old sessions --------------------
    user.sessions = []; // remove all previous sessions to enforce single device

    // -------------------- Create a fresh session --------------------
    user.sessions.push({
      token,                                       // JWT for new session
      userAgent: req.headers["user-agent"],       // Device/browser info
      ip: req.ip,                                 // Login IP address
      lastActivity: new Date(),                   // Timestamp of current activity
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Session expiry: 2 days
    });

    // -------------------- Save updated user --------------------
    await user.save();

    // -------------------- Send response --------------------
    return res.status(200).json({
      message: "Previous session terminated. Logged in successfully.",
      token, // return newly generated JWT
      user,  // return user details including updated session
    });

  } catch (err) {
    // -------------------- Error handling --------------------
    return res.status(500).json({ message: err.message });
  }
};


// -------------------- Logout Email Notification --------------------

/**
 * Sends a logout notification email to the user.
 * Useful for informing users about account activity and security.
 
 */
static async sendLogoutEmail(req, res) {
  // -------------------- Destructure request body --------------------
  const { email, name } = req.body; // 'email' = recipient email, 'name' = optional user name

  // -------------------- Validate input --------------------
  if (!email)
    return res.status(400).json({ message: "Email is required" });

  try {
    // -------------------- Create transporter --------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",                 // Using Gmail SMTP
      auth: {
        user: process.env.EMAIL_USER,   // Email username from environment variables
        pass: process.env.EMAIL_PASS,   // Email password/app-specific password
      },
    });

    // -------------------- Email content --------------------
    const mailOptions = {
      from: process.env.EMAIL_USER,                               // Sender address
      to: email,                                                  // Recipient address
      subject: "Logout Successful",                                // Email subject line
      text: `Hello ${name || "User"},\nYour account has been logged out successfully.`, // Plain text body
    };

    // -------------------- Send email --------------------
    await transporter.sendMail(mailOptions);
    console.log("✅ Logout email sent successfully:", email);

    // -------------------- Return success response --------------------
    return res.status(200).json({ success: true, message: "Logout email sent" });

  } catch (error) {
    // -------------------- Error handling --------------------
    console.error("❌ Error sending logout email:", error);
    return res.status(500).json({ success: false, message: "Failed to send email" });
  }
}


// -------------------- Check Session Middleware --------------------

/**
 * Middleware to validate user session and token.
 * Ensures the user is authenticated and session is active.
 * @param {Function} next - Express next middleware function
 */
static checkSession = async (req, res, next) => {
  try {
    // -------------------- Extract token from Authorization header --------------------
    const token = req.headers["authorization"]?.split(" ")[1]; 
    // Example: "Bearer <token>" => split and get actual token
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // -------------------- Verify JWT token --------------------
    const decoded = jwt.verify(token, "amarjeetKumar"); 
    // decoded contains payload (e.g., userID)

    // -------------------- Fetch user from DB --------------------
    const user = await authModel.findById(decoded.userID);
    if (!user) return res.status(401).json({ message: "User not found" });

    // -------------------- Find current session --------------------
    const sessionIndex = user.sessions.findIndex(sess => sess.token === token); 
    // Check if token exists in user's sessions
    if (sessionIndex === -1) return res.status(401).json({ message: "Session expired" });

    const session = user.sessions[sessionIndex];

    // -------------------- Check session inactivity --------------------
    const inactiveTime = Date.now() - session.lastActivity.getTime(); 
    // Time since last activity in milliseconds
    if (inactiveTime > 5 * 60 * 1000) { // 5 minutes inactivity
      user.sessions.splice(sessionIndex, 1); // remove expired session
      await user.save();
      return res.status(401).json({ message: "Auto logged out due to inactivity" });
    }

    // -------------------- Update lastActivity timestamp --------------------
    user.sessions[sessionIndex].lastActivity = new Date(); // reset lastActivity
    await user.save();

    // -------------------- Attach user and token to request --------------------
    req.user = user;   // authenticated user object
    req.token = token; // current session token

    // -------------------- Proceed to next middleware --------------------
    next();

  } catch (err) {
    // -------------------- Handle invalid or expired token --------------------
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


 // -------------------- Logout Current Session --------------------

/**
 * Logs out the current user session by removing the token from their active sessions.
 
 */
static logoutCurrentSession = async (req, res) => {
  try {
    // -------------------- Extract token from Authorization header --------------------
    const token = req.headers["authorization"]?.split(" ")[1]; 
    // Example: "Bearer <token>" => split and get actual token
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // -------------------- Find user who has this session token --------------------
    const user = await authModel.findOne({ "sessions.token": token }); 
    // Search user document containing this token in sessions array
    if (!user) return res.status(400).json({ message: "Session not found" });

    // -------------------- Remove the current session --------------------
    user.sessions = user.sessions.filter(s => s.token !== token); 
    // Filter out the session matching the current token
    await user.save(); // Save updated user sessions to database

    // -------------------- Return success response --------------------
    return res.status(200).json({ message: "Logged out successfully" });

  } catch (err) {
    // -------------------- Handle unexpected errors --------------------
    return res.status(500).json({ message: err.message });
  }
};


  // -------------------- Logout All Sessions --------------------

/**
 * Logs out the user from all active sessions on all devices.
 *
 * @param {Object} req - Express request object, expects authenticated user in req.user
 * @param {Object} res - Express response object to send status and message
 */
static logoutAllSessions = async (req, res) => {
  try {
    // -------------------- Get authenticated user's ID --------------------
    const userId = req.user._id; 
    // req.user is set by authentication middleware (checkIsUserAuthenticated or checkSession)

    // -------------------- Fetch user from database --------------------
    const user = await authModel.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    // -------------------- Clear all sessions --------------------
    user.sessions = []; 
    // Removes all active session objects from user's sessions array
    await user.save(); 
    // Persist changes to database

    // -------------------- Return success response --------------------
    return res.status(200).json({ message: "Logged out from all devices" });

  } catch (err) {
    // -------------------- Handle unexpected errors --------------------
    return res.status(500).json({ message: err.message });
  }
};



  static changePassword = async (req, res) => {
    const { newpassword, confirmpassword } = req.body;
    try {
      if (newpassword === confirmpassword) {
        const gensalt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(newpassword, gensalt);
        await authModel.findByIdAndUpdate(req.user._id, {
          password: hashedPassword,
        });
        return res
          .status(200)
          .json({ message: "password Changed Successfully" });
      } else {
        return res
          .status(400)
          .json({ message: "password and confirm password does not match" });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };

  static forgetPassword = async (req, res) => {
    const { email } = req.body;
    try {
      if (email) {
        const isUser = await authModel.findOne({ email: email });
        if (isUser) {
          // generate token
          const secretKey = isUser._id + "amarjeetKumar";

          const token = jwt.sign({ userID: isUser._id }, secretKey, {
            expiresIn: "5m",
          });

          const link = `http://localhost:3000/user/reset/${isUser._id}/${token}`;

          // email sending
          const transport = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            auth: {
              user: process.env.EMAIL,
              pass: process.env.EMAIL_PASSWORD,
            },
          });

          const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `Password Reset Request`,
            text: `
<!doctype html>
<html lang="en-US">

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <title>Reset Password Email Template</title>
    <meta name="description" content="Reset Password Email Template.">
    <style type="text/css">
        a:hover {text-decoration: underline !important;}
    </style>
</head>

<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
    <!--100% body table-->
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr>
            <td>
                <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                    align="center" cellpadding="0" cellspacing="0">
                    
                    <tr>
                        <td>
                            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px;">
                                        <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
                                            requested to reset your password</h1>
                                        <span
                                            style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                        <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                            We cannot simply send you your old password. A unique link to reset your
                                            password has been generated for you. To reset your password, click the
                                            following link and follow the instructions.
                                        </p>
                                        <a href=${link}
                                            style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                                            Password</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                   
                </table>
            </td>
        </tr>
    </table>
    <!--/100% body table-->
</body>

</html>`,
            html: `
<!doctype html>
<html lang="en-US">

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <title>Reset Password Email Template</title>
    <meta name="description" content="Reset Password Email Template.">
    <style type="text/css">
        a:hover {text-decoration: underline !important;}
    </style>
</head>

<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
    <!--100% body table-->
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr>
            <td>
                <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                    align="center" cellpadding="0" cellspacing="0">
                   
                    <tr>
                        <td>
                            <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px;">
                                        <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
                                            requested to reset your password</h1>
                                        <span
                                            style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                        <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                            We cannot simply send you your old password. A unique link to reset your
                                            password has been generated for you. To reset your password, click the
                                            following link and follow the instructions.
                                        </p>
                                        <a href="${link}"
                                            style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                                            Password</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                   
                </table>
            </td>
        </tr>
    </table>
    <!--/100% body table-->
</body>

</html>`,
          };

          transport.sendMail(mailOptions, (error, info) => {
            if (error) {
              return res.status(400).json({ message: "Error" });
            }
            return res.status(200).json({ message: "Email Sent" });
          });
        } else {
          return res.status(400).json({ message: "Invalid Email" });
        }
      } else {
        return res.status(400).json({ message: "email is required" });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };

  static forgetPasswordEmail = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const { id, token } = req.params;

    try {
      if (newPassword && confirmPassword && id && token) {
        if (newPassword === confirmPassword) {
          // token verifiying
          const isUser = await authModel.findById(id);
          const secretKey = isUser._id + "amarjeetKumar";
          const isValid = await jwt.verify(token, secretKey);
          if (isValid) {
            // password hashing

            const genSalt = await bcryptjs.genSalt(10);
            const hashedPass = await bcryptjs.hash(newPassword, genSalt);

            const isSuccess = await authModel.findByIdAndUpdate(isUser._id, {
              $set: {
                password: hashedPass,
              },
            });

            if (isSuccess) {
              return res.status(200).json({
                message: "Password Changed Successfully",
              });
            }
          } else {
            return res.status(400).json({
              message: "Link has been Expired",
            });
          }
        } else {
          return res
            .status(400)
            .json({ message: "password and confirm password does not match" });
        }
      } else {
        return res.status(400).json({ message: "All fields are required" });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };

  // -------------------- Email Verification --------------------

/**
 * Verifies the user's email using a token sent via email.
 *
 * @param {Object} req - Express request object, expects `token` in req.params
 * @param {Object} res - Express response object to send status and message
 */
static saveVerifiedEmail = async (req, res) => {
  // Extract token from URL parameters
  const { token } = req.params;

  try {
    if (token) {
      // -------------------- Verify JWT token --------------------
      const secretKey = "amarjeetGupta"; // Secret key used when generating verification token
      const isEmailVerified = await jwt.verify(token, secretKey);
      // isEmailVerified will contain the payload from token (e.g., { email: userEmail })

      if (isEmailVerified) {
        // -------------------- Find the user by email from token --------------------
        const getUser = await authModel.findOne({
          email: isEmailVerified.email,
        });

        // -------------------- Update user's isVerified field --------------------
        const saveEmail = await authModel.findByIdAndUpdate(getUser._id, {
          $set: { isVerified: true }, // mark email as verified
        });

        if (saveEmail) {
          return res
            .status(200)
            .json({ message: "Email Verification Success" });
        }

        // -------------------- If saving failed --------------------
        return res.status(500).json({ message: "Failed to verify email" });

      } else {
        // -------------------- Token is invalid or expired --------------------
        return res.status(400).json({ message: "Link Expired" });
      }
    } else {
      // -------------------- Token not provided --------------------
      return res.status(400).json({ message: "Invalid URL" });
    }
  } catch (error) {
    // -------------------- Handle unexpected errors --------------------
    return res.status(400).json({ message: error.message });
  }
};

}

export default authController;
