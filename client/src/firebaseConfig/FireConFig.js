//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved.
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

// ==================================================================
// FILE: firebaseConfig.js
// DESCRIPTION:
// This file initializes Firebase in the project, configures authentication,
// and exports the Firebase app and authentication providers for use in the app.
// ==================================================================

// Import Firebase core and auth functions
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

// ==================================================================
// FIREBASE CONFIGURATION
// Replace these with your Firebase project credentials from Firebase Console
// ==================================================================
const firebaseConfig = {
  apiKey: "AIzaSyA-IMESE-_XHgp36RG9XlRIvXKXccomkC4", // API key for project
  authDomain: "demotest-17256.firebaseapp.com", // Auth domain
  projectId: "demotest-17256", // Firebase project ID
  storageBucket: "demotest-17256.firebasestorage.app", // Storage bucket
  messagingSenderId: "103982561489", // Messaging sender ID
  appId: "1:103982561489:web:c2d68d005c59a29056edf0", // App ID
  measurementId: "G-QLGYQ428RG" // Measurement ID for analytics (optional)
};

// ==================================================================
// INITIALIZE FIREBASE APP
// ==================================================================
export const app = initializeApp(firebaseConfig);

// ==================================================================
// AUTHENTICATION SETUP
// Export auth object to handle Firebase Authentication
// ==================================================================
export const auth = getAuth(app);

// ==================================================================
// PROVIDERS
// Setup third-party authentication providers
// ==================================================================
export const googleProvider = new GoogleAuthProvider(); // Google Sign-In
export const facebookProvider = new FacebookAuthProvider(); // Facebook Sign-In
