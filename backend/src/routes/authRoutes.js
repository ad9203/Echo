import express from "express";
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  demoLogin,
  logout,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/demo", demoLogin);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
