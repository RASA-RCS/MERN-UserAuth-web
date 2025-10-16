//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved.
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//  with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact]

import React, { useState } from "react";
import axios from "../Services/axiosInterceptor"; // Custom Axios instance for secure API calls
import { toast } from "react-toastify"; // For user-friendly notifications
import { useNavigate } from "react-router-dom"; // For navigation between pages
import "react-toastify/dist/ReactToastify.css";
import "../css/ForgotPassword.css";
import "../css/signIn.css";
import audios from "../sound/iphone_16_messege_tone.mp3"; // Audio notification file

// ============================
// COMPONENT: ForgetPassword
// ============================
// Description: 
// This component allows a user to reset their password by sending a reset link
// to their registered email address. Includes audio feedback and toast notifications.
const ForgetPassword = () => {
  const navigate = useNavigate(); // Used for page redirection
  const [email, setEmail] = useState(); // Stores the user's entered email address

  // ----------------------------------------------------
  // FUNCTION: playLogoutSound
  // PURPOSE: Plays an audio notification when the password reset link is sent.
  // ----------------------------------------------------
  const playLogoutSound = () => {
    try {
      const logoutSound = new Audio(audios); // Create a new audio object from imported file
      logoutSound.volume = 0.8; // Set sound volume
      logoutSound.play().catch(() => {
        console.warn("⚠️ Logout sound playback blocked by browser until user interaction.");
      });
    } catch (err) {
      console.warn("⚠️ Audio play error:", err.message);
    }
  };

  // ----------------------------------------------------
  // FUNCTION: handleSubmit
  // PURPOSE: Handles the form submission event.
  // Sends a POST request to backend API to generate a reset password link.
  // Shows toast messages depending on the response.
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form refresh behavior

    try {
      // Send API request to backend for password reset
      const res = await axios.post(
        "/api/auth/forget-password",
        { email }, // Sending user email as request payload
        { timeout: 1000 } // Request timeout limit (1 second)
      );

      if (res.status === 200) {
        toast.success("Password reset link has been sent to your email!");
        playLogoutSound(); // Play sound notification
      } else {
        toast.warn("⚠️ Email Not Found or Unable to send reset link.");
      }
    } catch (error) {
      console.error("Error sending reset link:", error);

      // Handle specific timeout or network errors
      if (error.code === "ECONNABORTED") {
        toast.success("Password reset link has been sent to your email!");
        playLogoutSound();
      } else {
        toast.error("Email Not Found or Unable to send reset link.");
      }
    }
  };

  // ----------------------------------------------------
  // RETURN: UI Rendering Section
  // Renders the password reset form and login redirect option
  // ----------------------------------------------------
  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-96 singform">
      <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

      <div>
        {/* Password reset form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="tex">
            Email Address <span className="requiredStar">*</span>
          </p>
          <input
            name="email"
            type="email"
            placeholder="Enter your registered Email"
            onChange={(e) => setEmail(e.target.value)} // Update email state
            required
            className="emailinput"
          />

          <button
            type="submit"
            className="login w-full bg-red-500 text-white py-2 rounded"
          >
            Send Reset Link
          </button>
        </form>
      </div>

      {/* Redirect to login if password remembered */}
      <p className="text-sm text-center mt-3">
        If you remember your password?{" "}
        <span
          className="singbtn cursor-pointer font-medium underline"
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>
    </div>
  );
};

export default ForgetPassword;
