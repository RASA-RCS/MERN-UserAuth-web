//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 
import React, { useState } from "react";
import axios from "../Services/axiosInterceptor";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "../css/ForgotPassword.css"
import "../css/signIn.css";
import audios from "../sound/iphone_16_messege_tone.mp3"; 

const ForgetPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState();

  // ---------- Play Logout Sound ----------
    const playLogoutSound = () => {
      try {
        const logoutSound = new Audio(audios); //  use imported audio
        logoutSound.volume = 0.8;
        logoutSound.play().catch(() => {
          console.warn("⚠️ Logout sound playback blocked by browser until user interaction.");
        });
      } catch (err) {
        console.warn("⚠️ Audio play error:", err.message);
      }
    };

  const handleSubmit = async (e) => {
    
    e.preventDefault();


    try {
      const res = await axios.post(
        "/api/auth/forget-password",
        { email },
        { timeout: 1000 } // give backend enough time
      );

      if (res.status === 200) {
        toast.success(" Password reset link has been sent to your email!");
         playLogoutSound();
        
      } else {
        toast.warn("⚠️ Email Not Found or Unable to send reset link.");
      }
    } catch (error) {
      console.error("Error sending reset link:", error);

      if (error.code === "ECONNABORTED") {
        toast.success(" Password reset link has been sent to your email!");
        playLogoutSound();
      } else {
        toast.error(" Email Not Found or Unable to send reset link.");
      }
    }


  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-96 singform">
      <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
     
      <div className="">
        {/* login form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="tex">Email Address <span className="requiredStar">*</span></p>
          <input name="email" type="email" placeholder=" Enter your registered Email" onChange={(e) => setEmail(e.target.value)} required className="emailinput" />
         

          <button type="submit" className="login w-full bg-red-500 text-white py-2 rounded"  >Send Reset link</button>
        </form>
      </div>



      <p className="text-sm text-center mt-3">
        If you have remember password ? {" "}
        <span className="singbtn cursor-pointer font-medium underline"
          onClick={() => navigate("/login")}>Login</span>
      </p>
    </div>
  );
};

export default ForgetPassword;
