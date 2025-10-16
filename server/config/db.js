// ---------------- COPYRIGHT & CONFIDENTIALITY ----------------
//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import mongoose from "mongoose"; // Import Mongoose library for MongoDB interaction

/**
 * Function: connectDB
 * Description: Establishes a connection to MongoDB using Mongoose.
 * Behavior:
 *    - Connects to the database URL defined in process.env.MONGO_URI if present
 *    - Defaults to local MongoDB at mongodb://localhost:27017/UserDatabase
 *    - Uses modern connection options for stability
 *    - Logs success or failure messages
 */
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB
    const res = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/UserDatabase", // Use env variable or fallback to local DB
      {
        useNewUrlParser: true,      // Use new URL parser for MongoDB connection string
        useUnifiedTopology: true,   // Use new Server Discover and Monitoring engine
      }
    );

    // If connection successful
    console.log("✅ MongoDB connected successfully");

  } catch (err) {
    // Log connection error
    console.error("❌ MongoDB connection error:", err.message);

    // Exit Node.js process with failure
    process.exit(1);
  }
};

// Export the connectDB function to be used in other modules
export default connectDB;
