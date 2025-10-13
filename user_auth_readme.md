# 🔐 User Authentication System (MERN Stack)

A full-featured **User Authentication System** built using the **MERN stack**, implementing secure user registration (with optional Middle Name), email verification, OTP-based login, JWT session management, Google/Facebook sign-in, and automatic session expiry.

---

## 🧭 Table of Contents
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Architecture](#-project-architecture)
- [Installation](#️-installation)
- [Environment Variables](#-environment-variables)
- [Folder Structure](#-folder-structure)
- [Authentication Flow](#-authentication-flow)
  - [Registration Flow](#-registration-flow)
  - [Email Verification](#-email-verification)
  - [Login Flow](#login-flow-emailpassword--otp)
  - [Session Management](#session-management)
  - [Logout](#-logout)
- [ER Diagram](#er-diagram)
- [API Endpoints](#-api-endpoints)


---

## ✨ Features

✅ User Registration with Email Verification (supports optional Middle Name)  
✅ OTP-based Login (Email / Password + OTP)  
✅ Google & Facebook OAuth Login  
✅ JWT Session Management (auto expiry + inactivity logout)  
✅ Account Lock after 5 failed login attempts  
✅ Logout from current / all sessions  
✅ Auto Logout after 5 min inactivity  
✅ Responsive React Frontend with validation & Captcha  
✅ Secure Password Hashing with `bcryptjs`  
✅ Email service integration with `nodemailer`  

---

### 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js, Axios, CSS,Bootstrap,Tailwind css |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT, bcryptjs, nodemailer,Firebase |
| **Cloud / Hosting** | Localhost  |

---

## 🧩 Project Architecture

```
Frontend (React)
   │
   ├── Register → Validates Input → POST /register
   │
   ├── Email Verification → Clicks Token Link → /verify/:token
   │
   ├── Login → Email + Password → Generate OTP
   │
   ├── OTP → Verify → Create Session
   │
   ├── Home (Protected) → JWT + checkSession middleware
   │
   └── Logout → Clear Session(s)
```

---

## ⚙️ Installation

### 1️⃣ requiremet basic 
```bash
install vs-code else any other alternate-code editor
install node
install mongoCompass

```

### 2️⃣ Install Dependencies
#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd ../client
npm install
```

### 3️⃣ Start the App
#### Run Backend
```bash
cd server
npm start
```

#### Run Frontend
```bash
cd ../client
npm start
```

---

## 🧾 Environment Variables

Create a `.env` file inside your **server** folder:

```bash
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/authDB
JWT_SECRET=amarjeetGupta
EMAIL_USER=youremail@example.com
EMAIL_PASS=yourEmailPassword
CLIENT_URL=http://localhost:3000
```

---

## 📁 Folder Structure

```
user-authentication-system/
│
├── client/                     
│   ├── src/
│   │   ├── Components/
│   │   │   ├── Register.js
│   │   │   ├── Login.js
│   │   │   ├── OtpVerify.js
│   │   │   ├── Home.js
│   │   │   └── Captcha.js

│   │   ├── Services/
│   │   │   └── axiosInterceptor.js
│   │   ├── css/
│   │   └── App.js
│   └── package.json
│
├── server/ 
    ├── config/
        └── db.js 
        └── EmailTemplate.js                          
│   ├── controllers/
│   │   └── authController.js
│   ├── middlewares/
│   │   └── checkSession.js
│   ├── models/
│   │   └── authModel.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── server.js
│   └── package.json
│
└── README.md 






```

---

## 🔁 Authentication Flow

### Registration Flow
**Frontend (`Register.js`):**
- User fills out the form:  
  `Fname, Mname (optional), Lname, Email, Phone, Password`  
- Validations:  
  - Name fields: letters only  
  - Phone: 10 digits  
  - Password complexity: uppercase, lowercase, number, special character  
- If valid → `POST /api/auth/users/register`  
- Success → toast: “Please verify your email”

**Backend (`authController.userRegistration`):**
- Validate all fields  
- Check if user already exists  
- Hash password  
- Generate JWT email verification token (10 min expiry)  
- Send verification email  
- Save user (`isVerified: false`)  

---

### Email Verification
- Link → `/api/auth/verify/:token`  
- Verify JWT → update `isVerified: true`  
- Show frontend message: “Email Verified. You can login now.”

---

### Login Flow (Email/Password + OTP)
- Check user exists, verified, and not locked  
- Generate 6-digit OTP → save in DB  
- Send OTP via email  
- On OTP submit → verify, clear OTP, generate JWT session

---

## Session Management
- Each session stores: `token, userAgent, ip, lastActivity, expiresAt`  
- Auto logout after **5 min inactivity**  
- JWT expires in **2 days**  

---

### Logout
- Current session → remove token  
- All sessions → clear all tokens  
-  send logout email  

---

## 📊 ER Diagram

**User**
```
_id (ObjectId)
Fname, Mname, Lname
email (unique)
phone
password (hashed)
isVerified (Boolean)
loginOtp, loginOtpExpiry
loginAttempts, lockUntil
googleId, facebookId
lastLoginMethod (Google, Facebook, Email/Password)
sessions (array of Session objects)
```

**Session**
```
token (JWT)
userAgent
ip
lastActivity
expiresAt
```

**Textual ER Diagram**
```
+----------------+
|      User      |
+----------------+
| _id (PK)       |
| Fname          |
| Mname          |
| Lname          |
| email (U)      |
| phone          |
| password       |
| isVerified     |
| loginOtp       |
| loginOtpExpiry |
| loginAttempts  |
| lockUntil      |
| googleId       |
| facebookId     |
| lastLoginMethod|
+----------------+
        |
        | 1
        | has
        | *
+----------------+
|    Session     |
+----------------+
| token (PK)     |
| userAgent      |
| ip             |
| lastActivity   |
| expiresAt      |
+----------------+
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| `POST` | `/api/auth/users/register` | Register new user (Fname, Mname, Lname, Email, Phone, Password) |
| `GET` | `/api/auth/verify/:token` | Verify email |
| `POST` | `/api/auth/users/login` | Login with email & password |
| `POST` | `/api/auth/users/verify-otp` | Verify OTP |
| `POST` | `/api/auth/users/logout` | Logout current session |
| `POST` | `/api/auth/users/logout-all` | Logout all sessions |
| `POST` | `/api/auth/google` | Google login |
| `POST` | `/api/auth/facebook` | Facebook login |






