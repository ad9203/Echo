import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // Retrieve token from HTTP-only cookie or Authorization header fallback
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route. Please log in.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_super_secret_jwt_key_12345"
    );
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session token.",
      error: error.message,
    });
  }
};

export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_super_secret_jwt_key_12345"
    );
    req.user = await User.findById(decoded.id).select("-password");
  } catch (error) {
    // Session token invalid or expired, continue as guest
  }

  next();
};
