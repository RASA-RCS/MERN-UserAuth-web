//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved.
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//  with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact]

import React, { useState } from "react";
import axios from "../Services/axiosInterceptor"; // Custom axios setup for API requests
import { toast } from "react-toastify"; // For showing notifications
import "react-toastify/dist/ReactToastify.css";

// ==================================================================
// COMPONENT: ForgetPassword
// DESCRIPTION:
// This component provides a user interface for resetting the password.
// The user enters their registered email, and a password reset link
// is sent to them via email through the backend API.
// ==================================================================
const ForgetPassword = () => {

  // --------------------------------------------------------------
  // VARIABLE DECLARATIONS
  // --------------------------------------------------------------
  const [email, setEmail] = useState(); 
  // email → stores user-entered email address for password reset request

  // --------------------------------------------------------------
  // FUNCTION: handleSubmit
  // PURPOSE: Handles the form submission to send a password reset link.
  // 1. Prevents default form submission
  // 2. Sends POST request to backend with entered email
  // 3. Displays appropriate toast notification based on response
  // --------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh on form submission

    try {
      // ----- Backend API call: Check if email exists and send reset link -----
      const res = await axios.post(
        "/api/auth/forget-password",
        { email },
        { timeout: 1000 } // Set a timeout in case server takes too long
      );

      if (res.status === 200) {
        toast.success("✅ Password reset link has been sent to your email!");
      } else {
        toast.warn("⚠️ Failed to send reset link. Please try again.");
      }

    } catch (error) {
      console.error("❌ Error sending reset link:", error);

      // Handle timeout or server errors
      if (error.code === "ECONNABORTED") {
        toast.info("⏳ Email is being sent. Please check your inbox.");
      } else {
        toast.error("❌ Could not send reset link. Please try again later.");
      }
    }
  };

  // --------------------------------------------------------------
  // RETURN: UI Layout
  // Provides a Bootstrap-styled password reset form with image
  // --------------------------------------------------------------
  return (
    <section className="vh-100" style={{ backgroundColor: "#9A616D" }}>
      <div className="container py-5 h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col col-xl-10">
            <div className="card" style={{ borderRadius: "1rem" }}>
              <div className="row g-0">
                {/* Left Image Section */}
                <div className="col-md-6 col-lg-5 d-none d-md-block">
                  <img
                    src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img1.webp"
                    alt="login form"
                    className="img-fluid"
                    style={{ borderRadius: "1rem 0 0 1rem" }}
                  />
                </div>

                {/* Right Form Section */}
                <div className="col-md-6 col-lg-7 d-flex align-items-center">
                  <div className="card-body p-4 p-lg-5 text-black">
                    <form onSubmit={handleSubmit}>
                      <div className="d-flex align-items-center mb-3 pb-1">
                        <i
                          className="fas fa-cubes fa-2x me-3"
                          style={{ color: "#ff6219" }}
                        ></i>
                        <span className="h1 fw-bold mb-0">Forget Password?</span>
                      </div>

                      <h5
                        className="fw-normal mb-3 pb-3"
                        style={{ letterSpacing: "1px" }}
                      >
                        Type Your Email Here
                      </h5>

                      <div className="form-outline mb-4">
                        <input
                          type="email"
                          placeholder="Enter your registered Email"
                          className="form-control form-control-lg"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)} // Update email state
                          required
                        />
                      </div>

                      <div className="pt-1 mb-4">
                        <button
                          className="btn btn-dark btn-lg btn-block"
                          type="submit"
                        >
                          Send Email
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                {/* End Right Section */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Exporting the component for use in routes or other modules
export default ForgetPassword;
