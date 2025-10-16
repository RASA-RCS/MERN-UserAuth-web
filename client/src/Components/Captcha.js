//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import React, { useState, useEffect, useRef } from "react";

// ===========================
// COMPONENT: Captcha
// DESCRIPTION:
// Renders a CAPTCHA canvas with a given code. Adds random noise and rotates letters
// for security. Users can click the canvas to refresh/regenerate CAPTCHA.
// ===========================
const Captcha = ({ code, onChange }) => {
  const canvasRef = useRef(null); // Reference to the <canvas> element

  // -----------------------
  // FUNCTION: drawCaptcha
  // DESCRIPTION:
  // Draws CAPTCHA on the canvas with noise and randomized text rotation.
  // -----------------------
  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 150;
    canvas.height = 50;

    // -----------------------
    // BACKGROUND NOISE
    // -----------------------
    ctx.fillStyle = "#ccc"; // Light gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw random dots for noise
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random()})`; // Random transparency
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    // -----------------------
    // DRAW CAPTCHA TEXT
    // -----------------------
    ctx.font = "25px Arial"; // Text font and size
    for (let i = 0; i < text.length; i++) {
      // Random color for each letter
      ctx.fillStyle = `rgb(${Math.random()*150},${Math.random()*150},${Math.random()*150})`;

      ctx.save(); // Save current canvas state
      ctx.translate(25 * i + 15, 25); // Position each letter
      ctx.rotate((Math.random() - 0.5) * 0.5); // Random rotation
      ctx.fillText(text[i], 0, 0); // Draw the character
      ctx.restore(); // Restore canvas state for next letter
    }
  };

  // -----------------------
  // EFFECT: Redraw CAPTCHA when code changes
  // -----------------------
  useEffect(() => {
    drawCaptcha(code); // Draw initial CAPTCHA or update if code changes
  }, [code]);

  return (
    <canvas
      ref={canvasRef} // Link to canvas element
      className="border rounded cursor-pointer" // Styles: border, rounded corners, cursor pointer
      onClick={() => onChange()} // Refresh/regenerate CAPTCHA when clicked
    />
  );
};

export default Captcha;
