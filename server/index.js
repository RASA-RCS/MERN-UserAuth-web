// ---------------- COPYRIGHT & CONFIDENTIALITY ----------------
//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import express from "express";           // Express framework for building API server
import connectDB from "./config/db.js";  // MongoDB connection setup
import authRoutes from "./routes/authRoutes.js"; // All authentication related routes
import dotenv from "dotenv";             // Load environment variables from .env file
import cors from "cors";                 // Cross-Origin Resource Sharing middleware

// -------------------- Initialize App --------------------
const app = express();

// -------------------- Load Environment Variables --------------------
dotenv.config(); // Access process.env variables from .env file

// -------------------- Configuration --------------------
const PORT = process.env.PORT || 9000; // Set port from env or default 9000


// -------------------- Database Connection --------------------
connectDB(); // Connect to MongoDB

// -------------------- Middleware --------------------
app.use(cors());       // Enable CORS for all routes
app.use(express.json()); // Parse incoming JSON requests

// -------------------- Routes --------------------

// Root route to check server status
app.get("/", (req, res) => {
  res.send("Backend is Running.."); // Simple response to confirm server is live
});

// Authentication routes
app.use("/api/auth", authRoutes); // All routes prefixed with /api/auth

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`✅ API is Running on http://localhost:${PORT}`); // Server listening message
});
