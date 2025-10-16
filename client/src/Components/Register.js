//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import React, { useState } from "react";
import axios from "../Services/axiosInterceptor";
import "../css/signUp.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, googleProvider } from "../firebaseConfig/FireConFig";
import email_Icon from "../images/tl.webp";
import phoneicon from "../images/phone-call-icon-symbol-in-trendy-flat-style-call-icon-sign-for-app-logo-web-call-icon-flat-illustration-telephone-symbol-vector.jpg";
import user from "../images/login-avatar.png";
import pwd from "../images/password-76.png";
import audios from "../sound/success-340660.mp3";
import {
  FacebookAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth";


//------------------ Input data and send to the Backend ---------
const Register = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState({
    Fname: "",
    Mname: "",
    Lname: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordVisible, setPasswordVisible] = useState(false);   //for the password visible
  const [error, setError] = useState("");
  const [popupLoading, setPopupLoading] = useState(false);

  const facebookProvider = new FacebookAuthProvider();    //for the Facebook

  // -------------------- Validation --------------------
  const validate = () => {

    //-----validate the FName --------------
    if (!/^[A-Za-z]+$/.test(input.Fname))
      return "First name should only contain letters";

    //-----validate the MName --------------
    if (input.Mname && !/^[A-Za-z]+$/.test(input.Mname)) {
      return "Middle name should only contain letters";
    }
    //-----validate the LName --------------
    if (!/^[A-Za-z]+$/.test(input.Lname))
      return "Last name should only contain letters";

    //-----validate the Phone --------------
    if (!/^\d+$/.test(input.phone))
      return "Phone number should contain only digits";
    //-----validate the Phone --------------
    if (input.phone.length !== 10)
      return "Phone number must be 10 digits";
    //-----validate the Email --------------
    const emailRegex = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(input.email))
      return "Invalid email format (must start with a letter and be a valid email)";
    //-----validate the Password --------------
    if (input.password !== input.confirmPassword)
      return "Passwords do not match";
    //-----validate the Conform Password --------------
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(input.password)) {
      return "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.";
    }

    return "";
  };


  //------For the Paly Sond Notifaction-------
  const playSingUpSound = () => {
    try {
      const VerifyEmail = new Audio(audios); //  use imported audio
      VerifyEmail.volume = 0.8;
      VerifyEmail.play().catch(() => {
        console.warn("⚠️ Login sound playback blocked by browser until user interaction.");
      });
    } catch (err) {
      console.warn("⚠️ Audio play error:", err.message);
    }
  };
  // -------------------- Register --------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setError("");
    try {
      //--------------Send to the data-base----------- 
      const response = await axios.post("api/auth/users/register", input);
      if (response.status === 201) {
        playSingUpSound();  //method for when the sent the email the sound to be popup
        toast.success("User Registered successfully! Please Verify your Email");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  // -------------------- Google Sign --------------------
  const googleSign = async () => {
    if (popupLoading) return;
    setPopupLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      //send the data in to the database form fetch form the google
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
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("name", res.data.user.Fname);
          toast.success("Login successful!");
          navigate("/");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Google sign-in failed");
    } finally {
      setPopupLoading(false);
    }
  };

  // -------------------- Facebook Sign --------------------
  const facebookSign = async () => {
    if (popupLoading) return;
    setPopupLoading(true);
    const facebookProvider = new FacebookAuthProvider();
    facebookProvider.addScope("email");

    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      //send the data in to the database form fetch form the facebook
      const response = await axios.post("/api/auth/users/facebook-login", {
        email: user.email,
        uid: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("name", response.data.user?.Fname || user.displayName);
        toast.success("Registered successfully! Please login.");
        navigate("/");
      }
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        toast.info("Login cancelled. You closed the popup.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        const methods = await fetchSignInMethodsForEmail(auth, err.customData.email);
        toast.error(`This email exists with ${methods[0]}. Use that to login.`);
      } else {
        toast.error(err.message || "Facebook login failed");
      }
    } finally {
      setPopupLoading(false);
    }
  };

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
        {/* facebook button  */}
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

        {/* <a
          href="#"
          className="social-button apple-btn mt-2 w-full flex items-center justify-center gap-2 "
        >
          <img
            src="https://th.bing.com/th/id/R.1ec11a869384bc5e59625bac39b6a099?rik=1dlGqAp84GWGFw&riu=http%3a%2f%2fpngimg.com%2fuploads%2fapple_logo%2fapple_logo_PNG19692.png&ehk=5ghp5P0aLzQqfUKTsPihTYaIP%2b4VcHGKNovcBq8KOuo%3d&risl=&pid=ImgRaw&r=0"
            alt="Apple Logo"
            className="w-5 h-5"
          />
          Continue with Apple
        </a> */}

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
