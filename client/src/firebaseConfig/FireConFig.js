//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-IMESE-_XHgp36RG9XlRIvXKXccomkC4",
  authDomain: "demotest-17256.firebaseapp.com",
  projectId: "demotest-17256",
  storageBucket: "demotest-17256.firebasestorage.app",
  messagingSenderId: "103982561489",
  appId: "1:103982561489:web:c2d68d005c59a29056edf0",
  measurementId: "G-QLGYQ428RG"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider(); 
