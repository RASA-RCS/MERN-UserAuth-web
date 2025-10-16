//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Components/Login";
import Register from "./Components/Register";
import ChangePassword from "./Pages/ChangePassword";
import ForgetPassword from "./Pages/ForgotPassword";
import Home from "./Pages/Home";
import SessionExpired from "./Pages/SessionExpired"; 
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoutes from "./Services/ProtectedRoutes";



const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/reset-password" element={<ForgetPassword />} />
          <Route path="/user/reset/:id/:token" element={<ChangePassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/session-expired" element={<SessionExpired />} /> 
          
          <Route path="/" element={<ProtectedRoutes />}>
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>

      {/* Toastify container */}
      <ToastContainer 
        position="top-right" 
        autoClose={2000} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="colored" 
      />
    </>
  );
};

export default App;
