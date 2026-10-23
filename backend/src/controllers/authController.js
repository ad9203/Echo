import crypto from "crypto";
import User from "../models/User.js";
import { sendTokenResponse } from "../utils/sendToken.js";
import { validatePassword } from "../utils/passwordValidator.js";
import { sendOtpEmail } from "../utils/sendEmail.js";

// Helper: Generate secure 6-digit OTP
function generate6DigitOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// @desc    Register a new user (Enforces password policy & sends OTP via nodemailer)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your name, email, and password.",
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Enforce Password Security Policy
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail });

    // If account already exists and is verified
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    const otp = generate6DigitOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // If account exists but was never verified, update password and issue fresh OTP
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name.trim();
      existingUser.password = password; // Will be hashed by pre-save
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      // Create new unverified user
      existingUser = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        isVerified: false,
        otp,
        otpExpires,
      });
    }

    // Send verification email via Nodemailer
    await sendOtpEmail({
      to: cleanEmail,
      name: existingUser.name,
      otp,
    });

    return res.status(201).json({
      success: true,
      requiresOtp: true,
      email: cleanEmail,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please enter it to complete registration.`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    next(error);
  }
};

// @desc    Verify Email with 6-digit OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and 6-digit OTP code.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const user = await User.findOne({ email: cleanEmail }).select("+otp +otpExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found with this email.",
      });
    }

    if (user.isVerified) {
      // Already verified, log them in directly
      return sendTokenResponse(user, 200, res);
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "No active verification code found. Please request a new OTP.",
      });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please click 'Resend OTP'.",
      });
    }

    if (user.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check your email and try again.",
      });
    }

    // Mark as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Authenticate user with JWT cookie
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP Verification Code
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This email is already verified. You can log in directly.",
      });
    }

    const otp = generate6DigitOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail({
      to: cleanEmail,
      name: user.name,
      otp,
    });

    res.status(200).json({
      success: true,
      message: `A fresh 6-digit code has been sent to ${cleanEmail}.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (Validates password & verification status)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // If user has not verified their email via OTP yet
    if (!user.isVerified) {
      const otp = generate6DigitOtp();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOtpEmail({
        to: cleanEmail,
        name: user.name,
        otp,
      });

      return res.status(403).json({
        success: false,
        requiresOtp: true,
        email: cleanEmail,
        message: "Your email is not verified yet. We have sent a new 6-digit OTP to your email.",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Fast and reliable Demo Login (Always Verified)
// @route   POST /api/auth/demo
// @access  Public
export const demoLogin = async (req, res, next) => {
  try {
    const demoEmail = "demo@wisprflow.ai";
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      try {
        user = await User.create({
          name: "Wispr Flow Explorer",
          email: demoEmail,
          password: "DemoUserPassword123!",
          isVerified: true,
        });
      } catch (createErr) {
        if (createErr.code === 11000) {
          user = await User.findOne({ email: demoEmail });
        } else {
          throw createErr;
        }
      }
    }

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear HTTP-only cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
    sameSite: "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
