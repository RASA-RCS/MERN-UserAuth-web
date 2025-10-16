//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import React, { useState } from "react";
import axios from "../Services/axiosInterceptor"; // Axios instance for API calls
import "../css/signUp.css"; // CSS for styling the form
import { useNavigate } from "react-router-dom"; // For navigation after registration
import { ToastContainer, toast } from "react-toastify"; // Toast notifications
import "react-toastify/dist/ReactToastify.css";
import { auth, googleProvider } from "../firebaseConfig/FireConFig"; // Firebase auth and Google provider
import email_Icon from "../images/tl.webp"; // Email icon image
import phoneicon from "../images/phone-call-icon-symbol-in-trendy-flat-style-call-icon-sign-for-app-logo-web-call-icon-flat-illustration-telephone-symbol-vector.jpg"; // Phone icon image
import user from "../images/login-avatar.png"; // User icon
import pwd from "../images/password-76.png"; // Password icon
import audios from "../sound/success-340660.mp3"; // Audio file for success notification
import {
  FacebookAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth"; // Firebase Facebook auth methods

//------------------ Main Register Component -----------------
const Register = () => {
  const navigate = useNavigate(); // React Router navigate function

  // State to store user input fields
  const [input, setInput] = useState({
    Fname: "",           // First Name
    Mname: "",           // Middle Name (optional)
    Lname: "",           // Last Name
    phone: "",           // Phone number
    email: "",           // Email address
    password: "",        // Password
    confirmPassword: "", // Confirm password
  });

  const [passwordVisible, setPasswordVisible] = useState(false); // Toggle password visibility
  const [error, setError] = useState(""); // Stores validation error messages
  const [popupLoading, setPopupLoading] = useState(false); // Prevent multiple social login popups

  const facebookProvider = new FacebookAuthProvider(); // Firebase Facebook provider

  // -------------------- Validate Input Fields --------------------
  const validate = () => {
    // Validate First Name (letters only)
    if (!/^[A-Za-z]+$/.test(input.Fname))
      return "First name should only contain letters";

    // Validate Middle Name (letters only if provided)
    if (input.Mname && !/^[A-Za-z]+$/.test(input.Mname)) {
      return "Middle name should only contain letters";
    }

    // Validate Last Name (letters only)
    if (!/^[A-Za-z]+$/.test(input.Lname))
      return "Last name should only contain letters";

    // Validate Phone (digits only)
    if (!/^\d+$/.test(input.phone))
      return "Phone number should contain only digits";

    // Validate Phone length (10 digits)
    if (input.phone.length !== 10)
      return "Phone number must be 10 digits";

    // Validate Email format
    const emailRegex = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(input.email))
      return "Invalid email format (must start with a letter and be a valid email)";

    // Validate Password match
    if (input.password !== input.confirmPassword)
      return "Passwords do not match";

    // Validate Password complexity (min 8 chars, uppercase, lowercase, number, special char)
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(input.password)) {
      return "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.";
    }

    return ""; // No validation errors
  };

  // -------------------- Play Success Sound --------------------
  const playSingUpSound = () => {
    try {
      const VerifyEmail = new Audio(audios); // Create audio instance
      VerifyEmail.volume = 0.8; // Set volume
      VerifyEmail.play().catch(() => {
        console.warn("⚠️ Login sound playback blocked by browser until user interaction.");
      });
    } catch (err) {
      console.warn("⚠️ Audio play error:", err.message);
    }
  };

  // -------------------- Handle Manual Registration --------------------
  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent default form submit

    const validationError = validate(); // Validate input fields
    if (validationError) {
      setError(validationError); // Set error state
      toast.error(validationError); // Show toast
      return;
    }

    setError(""); // Clear previous errors
    try {
      // Send registration data to backend
      const response = await axios.post("api/auth/users/register", input);
      if (response.status === 201) {
        playSingUpSound(); // Play success audio
        toast.success("User Registered successfully! Please Verify your Email");
        setTimeout(() => navigate("/login"), 3000); // Redirect to login
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong"); // Show backend error
    }
  };

  // -------------------- Google Sign-In --------------------
  const googleSign = async () => {
    if (popupLoading) return; // Prevent multiple popups
    setPopupLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider); // Firebase Google popup
      const user = result.user;

      // Send Google user data to backend
      const res = await axios.post("api/auth/users/google-login", {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
      });

      if (res.status === 200) {
        if (res.data.isNewUser) {
          toast.success("Registered successfully! Please login.");
          setTimeout(() => navigate("/login"), 3000);
        } else {
          localStorage.setItem("token", res.data.token); // Save token
          localStorage.setItem("name", res.data.user.Fname); // Save user name
          toast.success("Login successful!");
          navigate("/"); // Redirect to home
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Google sign-in failed"); // Show error
    } finally {
      setPopupLoading(false); // Reset popup loading
    }
  };

  // -------------------- Facebook Sign-In --------------------
  const facebookSign = async () => {
    if (popupLoading) return; // Prevent multiple popups
    setPopupLoading(true);
    const facebookProvider = new FacebookAuthProvider(); // Create new provider
    facebookProvider.addScope("email"); // Request email access

    try {
      const result = await signInWithPopup(auth, facebookProvider); // Firebase Facebook popup
      const user = result.user;

      // Send Facebook user data to backend
      const response = await axios.post("/api/auth/users/facebook-login", {
        email: user.email,
        uid: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token); // Save token
        localStorage.setItem("name", response.data.user?.Fname || user.displayName); // Save name
        toast.success("Registered successfully! Please login.");
        navigate("/"); // Redirect to home
      }
    } catch (err) {
      // Handle common Firebase errors
      if (err.code === "auth/popup-closed-by-user") {
        toast.info("Login cancelled. You closed the popup.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        const methods = await fetchSignInMethodsForEmail(auth, err.customData.email);
        toast.error(`This email exists with ${methods[0]}. Use that to login.`);
      } else {
        toast.error(err.message || "Facebook login failed");
      }
    } finally {
      setPopupLoading(false); // Reset popup loading
    }
  };

  // -------------------- Render JSX --------------------
  return (
    <div className="w-full flex justify-center px-4 py-6">
      <div className="bg-white w-full max-w-md sm:max-w-lg lg:max-w-xl p-6 rounded-lg shadow-md">
        <ToastContainer position="top-right" autoClose={3000} />
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">Sign Up</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {/* FORM */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Name Fields */}
          <div>
            <p className="text-sm font-medium">
              Name<span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              {/* First Name */}
              <div className="flex items-center gap-2">
                <img src={user} className="w-5 h-5 sm:w-6 sm:h-6" />
                <input
                  name="Fname"
                  value={input.Fname}
                  placeholder="First Name"
                  onChange={(e) =>
                    setInput({ ...input, [e.target.name]: e.target.value })
                  }
                  required
                  maxLength={10}
                  className="w-full p-2 border rounded text-sm sm:text-base"
                />
              </div>

              {/* Middle Name */}
              <div className="flex items-center gap-2">
                <img src={user} className="w-5 h-5 sm:w-6 sm:h-6" />
                <input
                  name="Mname"
                  value={input.Mname}
                  placeholder="Middle Name"
                  onChange={(e) =>
                    setInput({ ...input, [e.target.name]: e.target.value })
                  }
                  maxLength={10}
                  className="w-full p-2 border rounded text-sm sm:text-base"
                />
              </div>

              {/* Last Name */}
              <div className="flex items-center gap-2">
                <img src={user} className="w-5 h-5 sm:w-6 sm:h-6" />
                <input
                  name="Lname"
                  value={input.Lname}
                  placeholder="Last Name"
                  onChange={(e) =>
                    setInput({ ...input, [e.target.name]: e.target.value })
                  }
                  required
                  maxLength={10}
                  className="w-full p-2 border rounded text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <p className="text-sm font-medium">
              Email Address<span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <img src={email_Icon} className="w-4 h-4 sm:w-6 sm:h-" />
              <input
                name="email"
                type="email"
                value={input.email}
                placeholder="Enter your Valid Email"
                onChange={(e) =>
                  setInput({ ...input, [e.target.name]: e.target.value })
                }
                required
                className="w-full p-2 border rounded text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <p className="text-sm font-medium">
              Phone No<span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <img src={phoneicon} className="w-5 h-5 sm:w-6 sm:h-6" />
              <input
                name="phone"
                maxLength={10}
                value={input.phone}
                placeholder="Enter your Contact Number"
                onChange={(e) =>
                  setInput({ ...input, [e.target.name]: e.target.value })
                }
                required
                className="w-full p-2 border rounded text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <p className="text-sm font-medium">
              Password<span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-2 mt-1 relative">
              <img src={pwd} className="w-5 h-5 sm:w-6 sm:h-6" />
              <input
                name="password"
                type={passwordVisible ? "text" : "password"}
                value={input.password}
                placeholder="Password"
                onChange={(e) =>
                  setInput({ ...input, [e.target.name]: e.target.value })
                }
                required
                className="w-full p-2 border rounded text-sm sm:text-base"
              />
              <span
                className="absolute right-3 cursor-pointer text-xs sm:text-sm"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? "Hide" : "👁️"}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <p className="text-sm font-medium">
              Confirm Password<span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <img src={pwd} className="w-5 h-5 sm:w-6 sm:h-6" />
              <input
                name="confirmPassword"
                type={passwordVisible ? "text" : "password"}
                value={input.confirmPassword}
                placeholder="Confirm Password"
                onChange={(e) =>
                  setInput({ ...input, [e.target.name]: e.target.value })
                }
                required
                className="w-full p-2 border rounded text-sm sm:text-base"
              />
            </div>
          </div>

          <span className="text-xs text-gray-500 block">
            Password must be at least 8 characters, include uppercase,
            lowercase, number & special character.
          </span>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition duration-200 text-sm sm:text-base signup"
          >
            Sign Up
          </button>
        </form>

        {/* Social Buttons */}
        <p className="text-center my-3">Or</p>
        {/* Google button  */}
        <button
          onClick={googleSign}
          className="social-button google-btn w-full mt-2 flex items-center justify-center gap-2"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google Logo"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        {/* Facebook button  */}
        <button
          onClick={facebookSign}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2 mb-2 text-sm sm:text-base"
        >
          <img
            src="https://www.facebook.com/images/fb_icon_325x325.png"
            alt="Facebook Logo"
            className="w-5 h-5"
          />
          Continue with Facebook
        </button>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <span
            className=" font-medium underline cursor-pointer singbtn"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
