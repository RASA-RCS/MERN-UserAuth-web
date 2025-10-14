import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../Services/axiosInterceptor";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import amarrpic from "../images/istockphoto-1432260067-612x612.jpg";
import session_exp from "../sound/ui-8-warning-sound-effect-336254.mp3"
import audios from "../sound/iphone_16_messege_tone.mp3"; // correct path for sound

const Home = () => {
  const navigate = useNavigate();
  const name = Cookies.get("name");
  const token = Cookies.get("token");
  const email = Cookies.get("email");

  const [timeLeft, setTimeLeft] = useState(null);
  const logoutTimer = useRef(null);
  const toastShown = useRef(false);
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(10);

  // ---------- Play Logout Sound ----------
  const playLogoutSound = () => {
    try {
      const logoutSound = new Audio(audios); //  use imported audio
      logoutSound.volume = 0.8;
      logoutSound.play().catch(() => {
        console.warn("⚠️ Logout sound playback blocked by browser until user interaction.");
      });
    } catch (err) {
      console.warn("⚠️ Audio play error:", err.message);
    }
  };



  // ---------- Play Logout Sound ----------
  const playoutSession = () => {
    try {
      const sessionWarn = new Audio(session_exp); //  use imported audio
      sessionWarn.volume = 0.8;
      sessionWarn.play().catch(() => {
        console.warn("⚠️ Logout sound playback blocked by browser until user interaction.");
      });
    } catch (err) {
      console.warn("⚠️ Audio play error:", err.message);
    }
  };

  const initiateLogout = () => {
    // playLogoutSound(); //  triggered by user click → browser allows it
    setShowLogoutDialog(true);
    setLogoutCountdown(10);
  };

  // ---------- Logout Countdown ----------
  useEffect(() => {
    if (!showLogoutDialog) return;
    const interval = setInterval(() => {
      setLogoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playLogoutSound();
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showLogoutDialog]);

  // ---------- Logout Function ----------
  const handleLogout = async () => {
    try {
      setShowLogoutDialog(false);
      toast.success("Logout sucessfully.....");

      //  Send logout email first
      if (email) {
        console.log("📩 Sending logout email for:", email);
        await axios.post("/api/auth/send-logout-email", { email, name });
        console.log("✅ Logout email sent successfully");
      }

      // Play sound after email sent
      playLogoutSound();

      //  Remove cookies and navigate
      Cookies.remove("token");
      Cookies.remove("name");
      // Cookies.remove("rememberData");
      Cookies.remove("sessionExpiry");

      toast.success("Logout successful!");
      navigate("/login");
    } catch (error) {
      console.error("❌ Error sending logout email:", error.message);
      toast.error("Logout email failed, but you are logged out.");

      // still logout even if email fails
      Cookies.remove("token");
      Cookies.remove("name");
     
      Cookies.remove("sessionExpiry");
      navigate("/login");
    }
  };

  // ---------- Session Expire ----------
  const handleSessionExpire = () => {
    Cookies.remove("token");
    Cookies.remove("name");
    Cookies.remove("sessionExpiry");
    navigate("/session-expired");
  };

  // ---------- Reset Inactivity Timer ----------
  const resetTimer = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);

    logoutTimer.current = setTimeout(() => {
      toast.info("Your session expired due to inactivity.", {
        position: "top-right",
        autoClose: 3000,
      });
      handleSessionExpire();
    }, INACTIVITY_LIMIT);

    Cookies.set("sessionExpiry", Date.now() + INACTIVITY_LIMIT, { expires: 1 });
    toastShown.current = false;
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, []);

  // ---------- Session Countdown ----------
  useEffect(() => {
    const interval = setInterval(() => {
      const expiryTime = Number(Cookies.get("sessionExpiry"));
      if (!expiryTime) return;
      const diff = expiryTime - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        handleSessionExpire();
        return;
      }
      setTimeLeft(diff);
      if (diff <= 60 * 1000 && !toastShown.current) {
        playoutSession();
        toast.warn("Your session will expire in 1 minute!", {
          position: "top-right",
          autoClose: 3000,
        });
        toastShown.current = true;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // ---------- Redirect if Not Logged In ----------
  useEffect(() => {
    if (!token) {
      toast.error("Please login first!");
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <section className="vh-100" style={{ backgroundColor: "#9e9093ff" }}>
      <ToastContainer />
      {/* ---------- Top-Right User Info & Logout ---------- */}
      <div className="flex justify-end items-center p-4 space-x-4">
        <span className="h3 font-semibold cursor-pointer text-gray-800 hover:text-gray-900 transition-colors">
          {name}
        </span>
        <button
          onClick={initiateLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* ---------- Main Content ---------- */}
      <div>
        <div className="container py-5 h-100">
          <div className="text-center">
            <h1 className="text-6xl">Welcome</h1>
          </div>
          <div className="row d-flex justify-content-center align-items-center h-100">
            <div className="col col-xl-10">
              <div className="card" style={{ borderRadius: "1rem" }}>
                <div className="row g-0">
                  <div className="col-md-6 col-lg-5 d-none d-md-block">
                    <img
                      src={amarrpic}
                      alt="login form"
                      className="img-fluid w-full h-full"
                      style={{ borderRadius: "1rem 0 0 1rem" }}
                    />
                  </div>
                  <div className="col-md-6 col-lg-7 d-flex align-items-center">
                    <div className="card-body p-4 p-lg-5 text-black">
                      <h1 className="text-center text-4xl">Home Page</h1>

                      {/* User Info in Card */}
                      <div className="text-center my-4">
                        <h2 className="text-2xl font-semibold">
                          Welcome, {name}!
                        </h2>
                        <p className="text-lg text-gray-700">
                          Your email: {email}
                        </p>
                      </div>

                      {timeLeft !== null && (
                        <h4 className="text-center text-danger mb-4 text-2xl">
                          Session expires in: {formatTime(timeLeft)}
                        </h4>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Logout Confirmation Dialog ---------- */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-4">
              Are you sure you want to logout? <br />
              Auto logout in{" "}
              <span className="font-bold">{logoutCountdown}</span> seconds
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(logoutCountdown / 10) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-around">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  playLogoutSound();
                  handleLogout();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Home;
