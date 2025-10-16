//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved.
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//  with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: legal@rasaconsultancy.com

import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * SessionExpired Component
 * -------------------------------------------------------
 * Displays a message when the user's session has expired.
 * Provides a button to redirect users back to the login page.
 * 
 * © 2025 Rasa Consultancy Services. Confidential and Proprietary.
 */
const SessionExpired = () => {
  const navigate = useNavigate();

  /**
   * handleLoginRedirect()
   * -------------------------------------------------------
   * Redirects the user to the login page when their session has expired.
   * 
   * © 2025 Rasa Consultancy Services. Confidential and Proprietary.
   */
  const handleLoginRedirect = () => {
    navigate("/login"); // redirect to login page
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8d7da",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          color: "#080707ff",
          marginBottom: "2",
          fontSize: "large",
          fontWeight: "bold",
        }}
      >
        Session Expired
      </h1>
      <p style={{ color: "#721c24", marginBottom: "30px" }}>
        Your session has expired due to inactivity.<br />Please login again to continue.
      </p>

      {/* 
        Login Again Button
        © 2025 Rasa Consultancy Services. Confidential and Proprietary.
      */}
      <button
        onClick={handleLoginRedirect}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0d0b0bff",
          border: "none",
          color: "white",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Login Again
      </button>
    </div>
  );
};

export default SessionExpired;
