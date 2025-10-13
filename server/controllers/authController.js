import authModel from "../models/authModel.js";
import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmailtoUser } from "../config/EmailTemplate.js";


// ---------------- Helper: Send OTP ----------------
const sendOtpEmail = async (email, otp) => {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your Login OTP Code",
    text: `Your OTP for login is: ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP for login is:</p><h2>${otp}</h2><p>It will expire in 5 minutes.</p>`,
  };

  await transport.sendMail(mailOptions);
};

class authController {

  // -------------------- User Registration --------------------
 static userRegistration = async (req, res) => {
  const { Fname, Mname, Lname, phone, email, password } = req.body;

  try {
    // Middle name is optional, so remove it from the required check
    if (Fname && Lname && phone && email && password) {
      const isUser = await authModel.findOne({ email: email });
      if (isUser) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        // Password Hashing
        const genSalt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, genSalt);

        // Generate Token
        const secretKey = "amarjeetGupta";
        const token = jwt.sign({ email: email }, secretKey, {
          expiresIn: "10m",
        });

        const link = `http://localhost:9000/api/auth/verify/${token}`;
        sendEmailtoUser(link, email);

        // Save the user
        const newUser = authModel({
          Fname,
          Mname: Mname || "", // store empty string if not provided
          Lname,
          phone,
          email,
          password: hashedPassword,
          isVerified: false,
        });

        const resUser = await newUser.save();
        if (resUser) {
          return res.status(201).json({
            message: "Registered Successfully. Please verify your email",
            user: resUser,
          });
        }
      }
    } else {
      return res.status(400).json({ message: "All required fields are mandatory" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

 
// ---------------- Logout Email Notification ----------------
static sendLogoutEmail = async (req, res) => {
  const { email, name } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Reuse OTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,          // same as OTP email
        pass: process.env.EMAIL_PASSWORD, // same as OTP email
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Logout Successful",
      text: `Hello ${name || "User"},\nYour account has been logged out successfully.`,
      html: `<p>Hello <strong>${name || "User"}</strong>,</p>
             <p>Your account has been <strong>logged out successfully</strong>.</p>`,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Logout email sent successfully for: ${email}`);
    return res.status(200).json({ success: true, message: "Logout email sent" });

  } catch (error) {
    console.error("❌ Error sending logout email:", error);
    return res.status(500).json({ success: false, message: "Failed to send email" });
  }
};


  // -------------------- Facebook Login --------------------
  static facebookLogin = async (req, res) => {
    try {
      const { uid, email, name, photoURL } = req.body;
      if (!uid || !email) return res.status(400).json({ message: "Invalid Facebook data" });

      let user = await authModel.findOne({ email });

      // Create new user if not exists
      if (!user) {
        const [Fname, ...rest] = name?.split(" ") || ["User"];
        const Lname = rest.length ? rest.join(" ") : "Unknown";
        user = new authModel({
          Fname,
          
          Lname,
          email,
          facebookId: uid,
          photoURL,
          isVerified: true,
          sessions: [],
          lastLoginMethod: "Facebook",
        });
      }
      else {
        user.facebookId = uid;
        user.lastLoginMethod = "Facebook"; // <-- update last login
      }
      await user.save();


      const token = jwt.sign({ userID: user._id }, "amarjeetKumar", { expiresIn: "2d" });

      // Single-device enforcement
      if (user.activeSessionCount() > 0) {
        return res.status(200).json({ forceLogout: true, token });
      }

      // Add current session
      user.sessions.push({
        token,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });

      await user.save();
      return res.status(200).json({ token, user });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };


  // -------------------- Email Login: Step 1 - Send OTP --------------------
  static userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
      if (!email || !password)
        return res.status(400).json({ message: "All fields are required" });

      const user = await authModel.findOne({ email });
      if (!user) return res.status(400).json({ message: "User not registered!" });
      if (!user.isVerified)
        return res.status(400).json({ message: "Email verification pending" });

      // Account lock check
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(403).json({ message: `Too many Failed Attempts. Your Account is Temporarily locked for  in ${minutesLeft} min.` });
      }

      // Password check
      const isMatch = await bcryptjs.compare(password, user.password);



      if (!isMatch) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 4) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        }
        await user.save();
        return res.status(400).json({ message: `Invalid credentials! (${user.loginAttempts || 0}/5 attempts)` });
      }


      // Update lastLoginMethod
      user.lastLoginMethod = "Email/Password";
      await user.save();

      // Reset login attempts
      user.loginAttempts = 0;
      user.lockUntil = null;

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      user.loginOtp = otp;
      user.loginOtpExpiry =  Date.now() + 5 * 60 * 1000; // 5 min
      user.loginAttempts = 0;
      await user.save();

      await sendOtpEmail(email, otp);
      return res.status(200).json({ otpSent: true, email: user.email });

    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };

  // -------------------- Verify OTP: Step 2 - Complete Login --------------------
  static verifyLoginOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
      if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

      const user = await authModel.findOne({ email });
      if (!user) return res.status(400).json({ message: "User not found" });

      if (!user.loginOtp || !user.loginOtpExpiry)
        return res.status(400).json({ message: "OTP not requested" });
      if (Date.now() > new Date(user.loginOtpExpiry).getTime())
        return res.status(400).json({ message: "OTP expired" });
      if (otp.toString() !== user.loginOtp.toString()) return res.status(400).json({ message: "Invalid OTP" });

      // Clear OTP
      user.loginOtp = null;
      user.loginOtpExpiry = null;

      const token = jwt.sign({ userID: user._id }, "amarjeetKumar", { expiresIn: "2d" });



      // Device enforcement: check existing sessions
      user.sessions = user.sessions.filter(
        sess => new Date(sess.expiresAt) > new Date()
      );

      if (user.sessions.length > 0) {
        return res.status(200).json({ forceLogout: true, token });
      }

      user.sessions.push({
        token,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      await user.save();

      // return res.status(200).json({ token, user });
      return res.json({ token, user: { Fname: user.Fname, email: user.email }, lastLoginMethod: user.lastLoginMethod });

    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };

  // -------------------- Google Login --------------------
  static googleLogin = async (req, res) => {
    const { uid, email, name, photoURL } = req.body;
    if (!email || !uid) return res.status(400).json({ message: "Invalid Google data" });

    try {
      let user = await authModel.findOne({ email });
      if (!user) {
        const [Fname, ...rest] = name?.split(" ") || ["User"];
        const Lname = rest.length ? rest.join(" ") : "Unknown";
        user = new authModel({
          Fname,
          Lname,
          email,
          googleId: uid,
          photoURL,
          lastLoginMethod: "Google",
          isVerified: true,
          sessions: [],
        });
      } else {
        // Existing user, update Google ID if missing
        user.googleId = uid;
        user.lastLoginMethod = "Google"; // <-- update last login
      }

      await user.save();

      const token = jwt.sign({ userID: user._id }, "amarjeetKumar", { expiresIn: "2d" });

      // Device enforcement
      if (user.sessions.length > 0) return res.status(200).json({ forceLogout: true, token });

      user.sessions.push({
        token,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      await user.save();

      return res.status(200).json({ token, user });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };

  // -------------------- Force Logout Previous Session --------------------
  static forceLogout = async (req, res) => {
    const { token, email } = req.body;
    try {
      const user = await authModel.findOne({ email });
      if (!user) return res.status(400).json({ message: "User not found" });

      // clear all old sessions
      user.sessions = [];

      // create fresh session
      user.sessions.push({
        token,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      await user.save();

      return res.status(200).json({
        message: "Previous session terminated. Logged in successfully.",
        token,
        user,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };

// Send logout email
  // ---------------- Logout Email Notification ----------------
  static async sendLogoutEmail(req, res) {
    const { email, name } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Logout Successful",
        text: `Hello ${name || "User"},\nYour account has been logged out successfully.`,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Logout email sent successfully:", email);

      return res.status(200).json({ success: true, message: "Logout email sent" });
    } catch (error) {
      console.error("❌ Error sending logout email:", error);
      return res.status(500).json({ success: false, message: "Failed to send email" });
    }
  }

  // -------------------- Check Session Middleware --------------------
  static checkSession = async (req, res, next) => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const decoded = jwt.verify(token, "amarjeetKumar");
      const user = await authModel.findById(decoded.userID);
      if (!user) return res.status(401).json({ message: "User not found" });

      const sessionIndex = user.sessions.findIndex(sess => sess.token === token);
      if (sessionIndex === -1) return res.status(401).json({ message: "Session expired" });

      const session = user.sessions[sessionIndex];
      const inactiveTime = Date.now() - session.lastActivity.getTime();
      if (inactiveTime > 5 * 60 * 1000) { // 5 minutes
        user.sessions.splice(sessionIndex, 1);
        await user.save();
        return res.status(401).json({ message: "Auto logged out due to inactivity" });
      }

      user.sessions[sessionIndex].lastActivity = new Date();
      await user.save();

      req.user = user;
      req.token = token;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };

  // -------------------- Logout Current Session --------------------
  static logoutCurrentSession = async (req, res) => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const user = await authModel.findOne({ "sessions.token": token });
      if (!user) return res.status(400).json({ message: "Session not found" });

      user.sessions = user.sessions.filter(s => s.token !== token);
      await user.save();

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };

  // -------------------- Logout All Sessions --------------------
  static logoutAllSessions = async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await authModel.findById(userId);
      if (!user) return res.status(400).json({ message: "User not found" });

      user.sessions = [];
      await user.save();

      return res.status(200).json({ message: "Logged out from all devices" });
    } catch (err) {
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

  static saveVerifiedEmail = async (req, res) => {
    const { token } = req.params;
    try {
      if (token) {
        // token verify
        const secretKey = "amarjeetGupta";
        const isEmailVerified = await jwt.verify(token, secretKey);
        if (isEmailVerified) {
          const getUser = await authModel.findOne({
            email: isEmailVerified.email,
          });

          const saveEmail = await authModel.findByIdAndUpdate(getUser._id, {
            $set: {
              isVerified: true,
            },
          });

          if (saveEmail) {
            return res
              .status(200)
              .json({ message: "Email Verification Success" });
          }

          //
        } else {
          return res.status(400).json({ message: "Link Expired" });
        }
      } else {
        return res.status(400).json({ message: "Invalid URL" });
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
}

export default authController;
