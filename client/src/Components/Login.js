import React, { useState, useEffect } from "react";
import axios from "../Services/axiosInterceptor";
import "../css/signIn.css";
import Captcha from "./Captcha";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebaseConfig/FireConFig";
import {
  FacebookAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import refreshIcon from "./refresh-removebg-preview.png";
import emailicon from '../images/tl.webp';
import pwd from "../images/password-76.png";
import audios from "../sound/success-340660.mp3";

// Utility functions
const encode = (str) => btoa(str);
const decode = (str) => atob(str);

const Login = () => {
  const navigate = useNavigate();

  // ---------------- Form State ----------------
  const [input, setInput] = useState({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ---------------- OTP State ----------------
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);

  // ---------------- Lockout State ----------------
  const [lockTimer, setLockTimer] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const LOCK_DURATION = 15 * 60; // 15 minutes

  // ---------------- Device Enforcement ----------------
  const [showDevicePrompt, setShowDevicePrompt] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);

  // ---------------- Random CAPTCHA ----------------
  const generateRandomCode = (length = 5) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };



  const [randomCode, setRandomCode] = useState(generateRandomCode());
  const [userCode, setUserCode] = useState("");


  // ---------------- OTP Animation State ----------------
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  // ---------------- Load remembered credentials ----------------
 useEffect(() => {
 const savedData = Cookies.get("rememberData");
  if (savedData) {
    try {
      const { email, password } = JSON.parse(savedData);
      setInput({
        email: email || "",
        password: password ? decode(password) : "",
      });
      setRememberMe(true);
    } catch {
      setInput((prev) => ({ ...prev, email: savedData }));
      setRememberMe(true);
    }
  }
}, []);


  // ---------- Play Logout Sound ----------
  const veriFyOtpSound = () => {
    try {
      const OutSound = new Audio(audios); // use imported audio
      OutSound.volume = 0.8;
      OutSound.play().catch(() => {
        console.warn("⚠️ Login sound playback blocked by browser until user interaction.");
      });
    } catch (err) {
      console.warn("⚠️ Audio play error:", err.message);
    }
  };
  // ---------------- OTP Countdown ----------------
  useEffect(() => {
    let interval;
    if (showOtpForm && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer <= 0 && showOtpForm) {
      setCanResend(true);
      toast.error("OTP expired! Please resend.");
    }
    return () => clearInterval(interval);
  }, [showOtpForm, timer]);

  // ---------------- Save Remember Me ----------------
  const saveRememberMe = (email, password) => {
    if (rememberMe) {
      Cookies.set(
        "rememberData",
        JSON.stringify({ email, password: encode(password) }),
        { expires: 30, secure: true, sameSite: "Strict" }
      );
    } else {
      Cookies.remove("rememberData");
    }
  };

  // ---------------- Lockout Countdown ----------------
  useEffect(() => {
    let lockInterval;
    if (lockTimer > 0) {
      lockInterval = setInterval(() => setLockTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(lockInterval);
  }, [lockTimer]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ---------------- Send OTP / Login ----------------
  const sendOtp = async () => {
    if (lockTimer > 0) {
      return toast.error(`Account locked! Try again in ${formatTime(lockTimer)}`);
    }

    try {
      const response = await axios.post("/api/auth/users/login", input, {
        timeout: 6000,
      });

      if (response.data.otpSent) {
        veriFyOtpSound();
        toast.success("OTP sent to your email!");

        setShowOtpForm(true);
        setUserEmail(input.email);
        setOtp("");
        setTimer(180);
        setCanResend(false);
      } else if (response.data.token) {
        // -------- Set Cookies --------
        Cookies.set("token", response.data.token, { expires: 7, secure: true, sameSite: "Strict" });
        Cookies.set("name", response.data.user?.Fname || "", { expires: 7, secure: true, sameSite: "Strict" });
        Cookies.set("email", response.data.user?.email || input.email, { expires: 7, secure: true, sameSite: "Strict" }); // NEW

         saveRememberMe(input.email, input.password); //  Save Remember Me

        if (rememberMe) {
          Cookies.set(
            "rememberData",
            JSON.stringify({
              email: input.email,
              password: encode(input.password),
            })
          );
        } else {
          Cookies.remove("rememberData");
        }

        toast.success("Login successful!");
        setFailedAttempts(0);
        navigate("/");
      } else {
        toast.error("Unexpected response from server");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      if (err.response?.status === 401) {
        setFailedAttempts((prev) => {
          const newCount = prev + 1;
          if (newCount >= 5) {
            setLockTimer(LOCK_DURATION);
            toast.error("Too many failed attempts. Account locked for 15 minutes.");
            return 0;
          } else {
            toast.error(`Wrong credentials! Attempt ${newCount} of 5`);
          }
          return newCount;
        });
      } else {
        toast.error(err.response?.data?.message || "Login failed");
      }
    }
  };

  // ---------------- Verify OTP ----------------
  const handleOtpVerify = async (e) => {

    e.preventDefault();
    if (!otp) return toast.error("Please enter OTP");

    try {
      const response = await axios.post(
        "/api/auth/verify-otp",
        { email: userEmail, otp },
        { timeout: 10000 }
      );

      if (response.data.forceLogout) {
        setShowDevicePrompt(true);
        setPendingToken(response.data.token);
        setPendingEmail(userEmail);
        return;
      }

      // -------- Set Cookies --------
      Cookies.set("token", response.data.token, { expires: 7, secure: true, sameSite: "Strict" });
      Cookies.set("name", response.data.user?.Fname || "", { expires: 7, secure: true, sameSite: "Strict" });
      Cookies.set("email", response.data.user?.email || userEmail, { expires: 7, secure: true, sameSite: "Strict" });
      
      saveRememberMe(userEmail, input.password);// NEW

      if (rememberMe) {
        Cookies.set(
          "rememberData",
          JSON.stringify({
            email: input.email,
            password: encode(input.password),
          }),
          { expires: 30, secure: true, sameSite: "Strict" } // 30 days for Remember Me
        );
      } else {
        Cookies.remove("rememberData");
      }

      toast.success("OTP verified! Login successful");
      navigate("/");
    } catch (err) {
      console.error("OTP verification error:", err);
      if (err.response?.status === 401) {
        navigate("/session-expire");
      } else {
        toast.error(err.response?.data?.message || "OTP verification failed");
      }
    }
  };

  // ---------------- Force Login ----------------
  const forceLogin = async () => {
    veriFyOtpSound();
    try {
      const response = await axios.post("/api/auth/users/forceLogout", {
        token: pendingToken,
        email: pendingEmail,
      });
      if (response.data.token) {
        Cookies.set("token", response.data.token, { expires: 7, secure: true, sameSite: "Strict" });
        Cookies.set("name", response.data.user?.Fname || "", { expires: 7, secure: true, sameSite: "Strict" });
        Cookies.set("email", response.data.user?.email || pendingEmail, { expires: 7, secure: true, sameSite: "Strict" }); // NEW

        saveRememberMe(input.email, input.password); 

        toast.success("Logged in successfully! Previous session ended.");
        setShowDevicePrompt(false);
        navigate("/");
      } else {
        toast.error("Force login failed: No token returned");
      }
    } catch (err) {
      console.error("Force login error:", err);
      toast.error(err.response?.data?.message || "Force login failed");
      setShowDevicePrompt(false);
    }
  };

  const cancelForceLogin = () => {
    setShowDevicePrompt(false);
    setPendingToken(null);
    setPendingEmail(null);
    setOtp("");
    toast.info("Login cancelled. Redirecting to login page...");
    navigate("/login");
  };

  // ---------------- Google Login ----------------
  const googleSign = async () => {

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const response = await axios.post(
        "/api/auth/users/google-login",
        {
          email: user.email,
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL,
        },
        { timeout: 10000 }
      );

      if (response.data.isNewUser) {
        toast.info("Email not registered! Please register first.");
        setTimeout(() => navigate("/register"), 3000);
        return;
      }

      if (response.data.token) {
        // -------- Set Cookies --------
        Cookies.set("token", response.data.token, { expires: 7, secure: true, sameSite: "Strict" });
        Cookies.set("name", user.displayName, { expires: 7, secure: true, sameSite: "Strict" });
        Cookies.set("email", user.email, { expires: 7, secure: true, sameSite: "Strict" }); // NEW

        saveRememberMe(input.email, input.password); 
        toast.success("Login successful!");
        navigate("/");
      }
    } catch (err) {
      console.error("Google login error:", err);
      if (err.code === "auth/account-exists-with-different-credential") {
        const methods = await fetchSignInMethodsForEmail(auth, err.customData.email);
        toast.error(
          `An account with this email already exists with ${methods[0]}. Please use that provider to login.`
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        toast.info("Login cancelled. You closed the popup.");
      } else if (err.code === "auth/cancelled-popup-request") {
        toast.info("Cancelled popup request. Please try again.");
      } else {
        toast.error(err.message || "Google login failed");
      }
    }
  };

  // ---------------- Facebook Login ----------------
  const facebookSign = async () => {

    const facebookProvider = new FacebookAuthProvider();

    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      const response = await axios.post(
        "/api/auth/users/facebook-login",
        {
          email: user.email,
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL,
        },
        { timeout: 10000 }
      );

      if (response.data.forceLogout) {
        setShowDevicePrompt(true);
        setPendingToken(response.data.token);
        setPendingEmail(user.email);
        return;
      }

      if (response.data.token) {
        // -------- Set Cookies --------
        Cookies.set("token", response.data.token, { expires: 7, secure: true, sameSite: "Strict" });
        Cookies.set("name", user.displayName, { expires: 7, secure: true, sameSite: "Strict" });
        Cookies.set("email", user.email, { expires: 7, secure: true, sameSite: "Strict" }); // NEW
        toast.success("Facebook login successful!");

        saveRememberMe(input.email, input.password); 
        navigate("/");
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      if (error.code === "auth/account-exists-with-different-credential") {
        const methods = await fetchSignInMethodsForEmail(auth, error.customData.email);
        toast.error(
          `An account with this email already exists with ${methods[0]}. Please use that provider to login.`
        );
      } else if (error.code === "auth/popup-closed-by-user") {
        toast.info("Login cancelled. You closed the popup.");
      } else if (error.code === "auth/cancelled-popup-request") {
        toast.info("Cancelled popup request. Please try again.");
      } else {
        toast.error(error.message || "Facebook login failed");
      }
    }
  };

  // ---------------- Render UI ----------------
  if (lockTimer > 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-96 singform text-center">
        <ToastContainer position="top-right" autoClose={3000} />
        <h2 className="text-2xl font-bold mb-4 text-center">Account Locked</h2>
        <p className="mb-4 text-red-500">Too many failed login attempts.</p>
        <p className="text-gray-700">Please try again after:</p>
        <p className="text-xl font-bold mt-2">{formatTime(lockTimer)}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate("/register")}
        >
          Sign Up
        </button>
      </div>
    );
  }

  if (showDevicePrompt) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-96 singform text-center">
        <ToastContainer position="top-right" autoClose={3000} />
        <h2 className="text-xl font-bold mb-4">
          ⚠️ You're currently logged in on another device
        </h2>
        <p className="mb-4">Logging in here will sign you out from that session.</p>
        <div className="flex justify-around mt-4">
          <button
            onClick={forceLogin}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Proceed to Login
          </button>
          <button
            onClick={cancelForceLogin}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-lg shadow-md w-96 singform gray-500 mag ">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-4 text-center ">Login</h2>

      {!showOtpForm ? (
        <form className="space-y-3">
          {/* Email & Password */}
          <p className="tex">Email Address <span className="requiredStar">*</span></p>
          <div className="flex gap-2">
            <span className="w-8 m-auto "><img src={emailicon} /></span>
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={input.email}
              className="inputBox p-2 w-full border rounded"
              onChange={(e) => setInput({ ...input, [e.target.name]: e.target.value })}
              required
            />
          </div>

          <p className="tex">Password <span className="requiredStar">*</span></p>
          <div className="relative flex">
            <span className="w-8 m-auto "><img src={pwd} /></span>
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              placeholder="Enter Password"
              value={input.password}
              className="inputBox p-2 w-full border rounded"
              onChange={(e) => setInput({ ...input, [e.target.name]: e.target.value })}
              required
            />
            <span
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? "Hide" : "👁️"}
            </span>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              id="rememberMe"
              className="cursor-pointer"
            />
            <label htmlFor="rememberMe" className="cursor-pointer text-sm">
              Remember Me
            </label>
          </div>

          {/* CAPTCHA */}
          <div className="mt-2">
            <p className="flex tex items-center justify-between">Enter the code below:</p>
            <div className=" flex gap-9">
              <span>
                <Captcha
                  code={randomCode}
                  onChange={() => setRandomCode(generateRandomCode())}
                />
              </span>
              <span className="ref-btn">
                <img
                  src={refreshIcon}
                  alt="refresh captcha"
                  className="refresh-icon w-8 m-2 "
                  onClick={() => setRandomCode(generateRandomCode())}
                  style={{ cursor: "pointer", marginLeft: "10px" }}
                />
              </span>
            </div>
            <br />
            <input
              type="text"
              value={userCode}
              placeholder="Type the code here"
              onChange={(e) => setUserCode(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="button"
            onClick={sendOtp}
            disabled={userCode !== randomCode}
            className={`login w-full py-2 rounded mt-2 ${userCode === randomCode
              ? "bg-red-500 text-white"
              : "bg-gray-300 text-yellow-100 cursor-not-allowed"
              }`}
          >
            Login
          </button>

          <p
            className="singbtn w-full text-end underline font-medium cursor-pointer"
            onClick={() => navigate("/reset-password")}
          >
            Forgot Password?
          </p>

          <p className="text-center my-3">Or</p>

          {/* Social Login */}
          <button
            type="button"
            onClick={googleSign}
            className="social-button google-btn w-full mt-3"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google Logo"
              className="icon"
            />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={facebookSign}
            className="social-button facebook-btn w-full mt-2 bg-blue-600 text-white flex items-center justify-center gap-2 py-2 rounded hover:bg-blue-700"
          >
            <img
              src="https://www.facebook.com/images/fb_icon_325x325.png"
              alt="Facebook Logo"
              className="icon w-5 h-5"
            />
            Continue with Facebook
          </button>

          {/* <a href="#" className="social-button apple-btn mt-2 w-full flex items-center justify-center gap-2">
            <img
              src="https://th.bing.com/th/id/R.1ec11a869384bc5e59625bac39b6a099?rik=1dlGqAp84GWGFw&riu=http%3a%2f%2fpngimg.com%2fuploads%2fapple_logo%2fapple_logo_PNG19692.png&ehk=5ghp5P0aLzQqfUKTsPihTYaIP%2b4VcHGKNovcBq8KOuo%3d&risl=&pid=ImgRaw&r=0"
              alt="Apple Logo"
              className="icon"
            />
            Continue with Apple
          </a> */}

          <p className="text-sm text-center mt-3">
            Don’t have an account?{" "}
            <span
              className="singbtn cursor-pointer font-medium underline"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </span>
          </p>
        </form>
      ) : (
        <form onSubmit={handleOtpVerify} className="space-y-3">
          <p>Enter the 6-digit OTP sent to {userEmail}</p>
          <div
            className={`flex justify-between gap-2 mb-2 transition-transform duration-300 ${otpError ? "animate-shake" : otpSuccess ? "animate-glow" : ""
              }`}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const isDigitValid = /^\d$/.test(otp[i] || "");
              return (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={otp[i] || ""}
                  id={`otp-${i}`}
                  className={`w-12 h-12 text-center border rounded-md text-xl transition focus:ring-2 focus:ring-blue-400 ${otp[i]
                      ? isDigitValid
                        ? "border-green-500"
                        : "border-red-500"
                      : "border-gray-300"
                    }`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^\d?$/.test(val)) return; // only digits
                    const newOtp = otp.split("");
                    newOtp[i] = val;
                    setOtp(newOtp.join(""));

                    // auto-focus next input
                    if (val && i < 5) {
                      const nextInput = document.getElementById(`otp-${i + 1}`);
                      nextInput && nextInput.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle backspace
                    if (e.key === "Backspace") {
                      e.preventDefault(); // prevent default backspace behavior
                      const newOtp = otp.split("");
                      newOtp[i] = ""; // clear current box
                      setOtp(newOtp.join(""));

                      if (i > 0) {
                        const prevInput = document.getElementById(`otp-${i - 1}`);
                        prevInput && prevInput.focus();
                      }
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasteData = e.clipboardData.getData("Text").trim().slice(0, 6);
                    if (!/^\d+$/.test(pasteData)) return; // only allow digits
                    const pasteArray = pasteData.split("");
                    const newOtp = [...otp.split("")];
                    for (let j = 0; j < 6; j++) {
                      newOtp[j] = pasteArray[j] || "";
                    }
                    setOtp(newOtp.join(""));

                    
                    const nextInput = document.getElementById(`otp-${pasteArray.length - 1}`);
                    nextInput && nextInput.focus();
                  }}
                />
              );
            })}
          </div>

          <p className="text-sm text-gray-500">
            OTP expires in: <span className="font-semibold">{formatTime(timer)}</span>
          </p>
          <button
            type="submit"
            className="login w-full bg-green-500 text-white py-2 rounded"
          >
            Verify OTP
          </button>
          <button
            type="button"
            disabled={!canResend}
            onClick={sendOtp}
            className={`w-full py-2 rounded ${canResend ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
          >
            Resend OTP
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;
