//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoutes = () => {
  const token = localStorage.getItem("token");
  const sessionExpiry = Number(localStorage.getItem("sessionExpiry"));

  // If no token, redirect to login
  if (!token) return <Navigate to="/login" />;

  // If session expired, redirect to session-expired page
  if (sessionExpiry && Date.now() > sessionExpiry) {
    return <Navigate to="/session-expired" />;
  }

  // Otherwise, allow access
  return <Outlet />;
};

export default ProtectedRoutes;
