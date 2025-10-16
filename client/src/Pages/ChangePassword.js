//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved.
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//  with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact]

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Get route params and navigate programmatically
import axios from "../Services/axiosInterceptor"; // Custom axios instance for secure API requests
import { toast, ToastContainer } from "react-toastify"; // For notifications
import "react-toastify/dist/ReactToastify.css";
import "../css/ForgotPassword.css";
import "../css/signIn.css";

// ===========================
// COMPONENT: ChangePassword
// DESCRIPTION:
// Allows users to set a new password after receiving a password reset link.
// The component validates the new password, checks confirmation, and sends
// the data to backend API for updating the password.
// ===========================
const ChangePassword = () => {
  // Get id and token from URL params for password reset verification
  const { id, token } = useParams();

  const navigate = useNavigate(); // For page redirection after successful reset

  // -----------------------
  // STATE VARIABLES
  // -----------------------
  const [input, setInput] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  // input.newPassword → stores new password
  // input.confirmPassword → stores confirm password

  const [showPassword, setShowPassword] = useState(false);
  // Controls visibility of password input (text/password)

  // -----------------------
  // PASSWORD VALIDATION RULES
  // -----------------------
  const validations = {
    minLength: /.{8,}/,
    upperCase: /[A-Z]/,
    lowerCase: /[a-z]/,
    number: /[0-9]/,
    specialChar: /[@$!%*?&]/,
  };

  // -----------------------
  // FUNCTION: getValidationStatus
  // PURPOSE: Returns an object showing whether the password meets each validation rule
  // -----------------------
  const getValidationStatus = (password) => ({
    minLength: validations.minLength.test(password),
    upperCase: validations.upperCase.test(password),
    lowerCase: validations.lowerCase.test(password),
    number: validations.number.test(password),
    specialChar: validations.specialChar.test(password),
  });

  // -----------------------
  // FUNCTION: handleSubmit
  // PURPOSE: Handles password reset form submission
  // 1. Prevents default form behavior
  // 2. Validates password rules
  // 3. Checks if new and confirm passwords match
  // 4. Sends POST request to backend to update password
  // 5. Shows toast notifications and redirects on success
  // -----------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password rules
    const status = getValidationStatus(input.newPassword);
    const allValid = Object.values(status).every(Boolean);

    if (!allValid) {
      toast.error("Password does not meet all requirements.");
      return;
    }

    // Confirm password match
    if (input.newPassword !== input.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      // API call to change password
      const res = await axios.post(
        `/api/auth/forget-password/${id}/${token}`,
        input
      );

      if (res.status === 200) {
        toast.success(" Password changed successfully!");
        setTimeout(() => navigate("/login"), 2000); // Redirect after 2 seconds
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(" Failed to change password. Try again later.");
    }
  };

  // Live validation status to show password rules
  const passwordStatus = getValidationStatus(input.newPassword);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-96 singform">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

      <div>
        {/* Password reset form */}
        <form onSubmit={handleSubmit}>
          <div className="d-flex align-items-center mb-3 pb-1">
            <i
              className="fas fa-cubes fa-2x me-3"
              style={{ color: "#ff6219" }}
            ></i>
          </div>

          {/* New Password Input */}
          <div className="form-outline mb-2 position-relative">
            <label htmlFor="password" className="tex">
              New Password <span className="requiredStar">*</span>
            </label>
            <br />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter New Password"
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

          {/* Live Password Rules */}
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

          {/* Confirm Password Input */}
          <div className="form-outline mb-4">
            <label htmlFor="Conpassword" className="tex">
              Confirm Password <span className="requiredStar">*</span>
            </label>
            <br />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Confirm Password"
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

          {/* Submit Button */}
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
    </div>
  );
};

export default ChangePassword;
