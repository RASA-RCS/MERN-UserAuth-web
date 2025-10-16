// ---------------- COPYRIGHT & CONFIDENTIALITY ----------------
//  Copyright (c) [2025] [Rasa Consultancy Services]. All rights reserved. 
//  This software is the confidential and proprietary information of [Rasa Consultancy Services]. 
//  You shall not disclose such confidential information and shall use it only in accordance 
//with the terms of the license agreement you entered into with [Rasa Consultancy Services].
//  For more information, please contact: [Your Company Email/Legal Department Contact] 

import nodemailer from "nodemailer";

/**
 * Function: sendEmailtoUser
 * Description: Sends a verification email to the user with the provided link.
 * Parameters:
 *    link  - The verification URL that the user should click to verify email
 *    email - The recipient's email address
 * Returns: A promise resolving an object { success: boolean, message: string }
 */
export const sendEmailtoUser = async (link, email) => {
  try {
    // ---------------- Create transporter ----------------
    // nodemailer transporter object for sending emails
    const transport = nodemailer.createTransport({
      service: "gmail",          // Using Gmail service
      host: "smtp.gmail.com",    // SMTP host for Gmail
      port: 465,                 // Port 465 for secure SMTP
      secure: true,              // Enable SSL
      auth: {
        user: process.env.EMAIL,           // Your Gmail address from environment variables
        pass: process.env.EMAIL_PASSWORD,  // Gmail app password or account password
      },
    });

    // ---------------- Mail Options ----------------
    // mailOptions defines the email content and recipient
    const mailOptions = {
      from: process.env.EMAIL,    // Sender email
      to: email,                  // Recipient email
      subject: "Verify Your Email", // Email subject
      html: `
        <!doctype html>
        <html lang="en-US">
        <head>
            <meta charset="UTF-8">
            <title>Verify Your Email</title>
            <style>
                a:hover { text-decoration: underline !important; }
            </style>
        </head>
        <body style="margin:0; padding:0; background-color:#f2f3f8; font-family: 'Open Sans', sans-serif;">
            <!-- Outer table for full width -->
            <table width="100%" bgcolor="#f2f3f8" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center">
                        <!-- Inner table for email content -->
                        <table width="95%" max-width="670px" bgcolor="#fff" style="border-radius:3px; text-align:center; box-shadow:0 6px 18px rgba(0,0,0,.06);">
                            <tr><td height="40"></td></tr>
                            <tr>
                                <td style="padding:0 35px;">
                                    <!-- Main heading -->
                                    <h1 style="color:#1e1e2d; font-weight:500; font-size:32px;">Thank you for registering!</h1>
                                    <!-- Instruction text -->
                                    <p style="color:#455056; font-size:15px; line-height:24px;">Click the link below to verify your email.</p>
                                    <!-- Verification button -->
                                    <a href="${link}" style="background:#20e277; color:#fff; text-decoration:none; font-weight:500; font-size:14px; padding:10px 24px; border-radius:50px; display:inline-block; margin-top:20px;">Verify Email</a>
                                </td>
                            </tr>
                            <tr><td height="40"></td></tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    };

    // ---------------- Send Email ----------------
    // sendMail returns a promise with info about email delivery
    const info = await transport.sendMail(mailOptions);

    // Log successful email sending
    console.log("✅ Email sent:", info.response);

    // Return success response
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    // Log error if email fails
    console.error("❌ Email sending error:", error);

    // Return failure response
    return { success: false, message: error.message || "Email sending failed" };
  }
};
