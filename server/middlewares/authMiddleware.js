import jwt from "jsonwebtoken";
import authModel from "../models/authModel.js";

const checkIsUserAuthenticated = async (req, res, next) => {
  let token;
  const { authorization } = req.headers;

  if (authorization && authorization.startsWith("Bearer")) {
    try {
      token = authorization.split(" ")[1];

      //  Verify token
      const { userID } = jwt.verify(token, "amarjeetKumar");

      //  Get user from DB
      const user = await authModel.findById(userID).select("-password");
      if (!user) return res.status(401).json({ message: "User not found" });

      //  Check if this token is active in user's sessions (works for email, Google, Facebook)
      const sessionExists = user.sessions.some(sess => sess.token === token);
      if (!sessionExists) {
        return res.status(401).json({ message: "Session expired or invalid" });
      }

      
      user.sessions = user.sessions.filter(sess => {
        const inactiveTime = Date.now() - new Date(sess.lastActivity).getTime();
        return inactiveTime <= 3 * 60 * 1000;  
      });
      await user.save();

      
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json({ message: "unAuthorized User" });
    }
  } else {
    return res.status(401).json({ message: "unAuthorized User" });
  }
};

export default checkIsUserAuthenticated;
