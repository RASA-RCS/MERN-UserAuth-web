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
