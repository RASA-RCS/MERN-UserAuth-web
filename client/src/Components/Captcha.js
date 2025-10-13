import React, { useState, useEffect, useRef } from "react";

const Captcha = ({ code, onChange }) => {
  const canvasRef = useRef(null);

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 150;
    canvas.height = 50;

    // Background noise
    ctx.fillStyle = "#ccc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random()})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    // Draw text
    ctx.font = "25px Arial";
    for (let i = 0; i < text.length; i++) {
      ctx.fillStyle = `rgb(${Math.random()*150},${Math.random()*150},${Math.random()*150})`;
      ctx.save();
      ctx.translate(25 * i + 15, 25);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    drawCaptcha(code);
  }, [code]);

  return (
    <canvas
      ref={canvasRef}
      className="border rounded cursor-pointer"
      onClick={() => onChange()}
    />
  );
};

export default Captcha;
