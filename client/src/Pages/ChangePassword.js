//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../Services/axiosInterceptor";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/ForgotPassword.css";
import "../css/signIn.css"

const ChangePassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  //Password validation rules
  const validations = {
    minLength: /.{8,}/,
    upperCase: /[A-Z]/,
    lowerCase: /[a-z]/,
    number: /[0-9]/,
    specialChar: /[@$!%*?&]/,
  };

  const getValidationStatus = (password) => ({
    minLength: validations.minLength.test(password),
    upperCase: validations.upperCase.test(password),
    lowerCase: validations.lowerCase.test(password),
    number: validations.number.test(password),
    specialChar: validations.specialChar.test(password),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const status = getValidationStatus(input.newPassword);
    const allValid = Object.values(status).every(Boolean);

    if (!allValid) {
      toast.error("Password does not meet all requirements.");
      return;
    }

    if (input.newPassword !== input.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.post(
        `/api/auth/forget-password/${id}/${token}`,
        input
      );
      if (res.status === 200) {
        toast.success(" Password changed successfully!");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("❌ Failed to change password. Try again later.");
    }
  };

  const passwordStatus = getValidationStatus(input.newPassword);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-96 singform">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
      
      <div className="">
        {/* login form */}
        <form onSubmit={handleSubmit}>
          <div className="d-flex align-items-center mb-3 pb-1">
            <i
              className="fas fa-cubes fa-2x me-3"
              style={{ color: "#ff6219" }}
            ></i>

          </div>

          

          {/*  New Password Input */}
          <div className="form-outline mb-2 position-relative">
            <label for="password" className="tex">New Password <span className="requiredStar">*</span></label><br />
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" Enter New Password"
              id="password"
              className="inputBox"
              name="newPassword"
              value={input.newPassword}
              onChange={(e) =>
                setInput({ ...input, [e.target.name]: e.target.value })
              }
              required
            />
            <span
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer changePassInput"
              style={{ cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "👁️"}
            </span>
          </div>

          {/*  Live Password Rules */}
          <ul className="text-start small mb-3">
            <li style={{ color: passwordStatus.minLength ? "green" : "red" }}>
              {passwordStatus.minLength ? "✔" : "✘"} At least 8 characters
            </li>
            <li style={{ color: passwordStatus.upperCase ? "green" : "red" }}>
              {passwordStatus.upperCase ? "✔" : "✘"} One uppercase letter
            </li>
            <li style={{ color: passwordStatus.lowerCase ? "green" : "red" }}>
              {passwordStatus.lowerCase ? "✔" : "✘"} One lowercase letter
            </li>
            <li style={{ color: passwordStatus.number ? "green" : "red" }}>
              {passwordStatus.number ? "✔" : "✘"} One number
            </li>
            <li style={{ color: passwordStatus.specialChar ? "green" : "red" }}>
              {passwordStatus.specialChar ? "✔" : "✘"} One special character (@$!%*?&)
            </li>
          </ul>

          {/*  Confirm Password */}
          <div className="form-outline mb-4">
            <label for="Conpassword" className="tex">Confirm Password <span className="requiredStar">*</span></label><br />
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" Enter Confirm Password"
              className="inputBox"
              id="Conpassword"
              name="confirmPassword"
              value={input.confirmPassword}
              onChange={(e) =>
                setInput({ ...input, [e.target.name]: e.target.value })
              }
              required
            />
          </div>

          <div className="pt-1 mb-4">
            <button
              className="login w-full bg-red-500 text-white py-2 rounded"
              type="submit"
            >
              Reset Password
            </button>
          </div>
        </form>
      </div>

      {/* Social media login buttons */}
    </div>
  );
};

export default ChangePassword;
