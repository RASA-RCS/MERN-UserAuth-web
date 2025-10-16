//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 
import React, { useState } from "react";
import axios from "../Services/axiosInterceptor";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgetPassword = () => {
  const [email, setEmail] = useState();

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
      } else {
        toast.warn("⚠️ Failed to send reset link. Please try again.");
      }
    } catch (error) {
      console.error("Error sending reset link:", error);

      if (error.code === "ECONNABORTED") {
        toast.info("⏳ Email is being sent. Please check your inbox.");
      } else {
        toast.error("❌ Could not send reset link. Please try again later.");
      }
    }


  };

  return (
    <section class="vh-100" style={{ backgroundColor: "#9A616D" }}>
      <div class="container py-5 h-100">
        <div class="row d-flex justify-content-center align-items-center h-100">
          <div class="col col-xl-10">
            <div class="card" style={{ borderRadius: "1rem" }}>
              <div class="row g-0">
                <div class="col-md-6 col-lg-5 d-none d-md-block">
                  <img
                    src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img1.webp"
                    alt="login form"
                    class="img-fluid"
                    style={{ borderRadius: "1rem 0 0 1rem" }}
                  />
                </div>
                <div class="col-md-6 col-lg-7 d-flex align-items-center">
                  <div class="card-body p-4 p-lg-5 text-black">
                    <form onSubmit={handleSubmit}>
                      <div class="d-flex align-items-center mb-3 pb-1">
                        <i
                          class="fas fa-cubes fa-2x me-3"
                          style={{ color: " #ff6219" }}
                        ></i>
                        <span class="h1 fw-bold mb-0">Forget Password?</span>
                      </div>

                      <h5
                        class="fw-normal mb-3 pb-3"
                        style={{ letterSpacing: "1px" }}
                      >
                        Type Your Email Here
                      </h5>

                      <div class="form-outline mb-4">
                        <input
                          type="email"
                          id=""

                          placeholder="Enter New Email"
                          class="form-control form-control-lg"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>

                      <div class="pt-1 mb-4">
                        <button
                          class="btn btn-dark btn-lg btn-block"
                          type="submit"
                        >
                          Send Email
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgetPassword;
