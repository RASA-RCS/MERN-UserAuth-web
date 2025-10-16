//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 
import React from "react";
import { useNavigate } from "react-router-dom";


const SessionExpired = () => {
  const navigate = useNavigate();

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
      <h1 style={{ color: "#080707ff", marginBottom: "2", fontSize:"Large", font:"bold"}} className="">Session Expired</h1>
      <p style={{ color: "#721c24", marginBottom: "30px" }}>
        Your session has expired  due to inactivity.. <br/>Please login again to continue.
      </p>
      <button
        onClick={handleLoginRedirect}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0d0b0bff",
          border: "none",
          color:"white",
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
