import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  X,
  ShieldCheck,
  Mail,
  KeyRound,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";

const AuthModal = ({ isOpen, onClose, initialMode = "login", onLogout }) => {
  const { user, login, demoLogin, register, verifyOtp, resendOtp, logout, isAuthenticated } = useAuth();

  const [mode, setMode] = useState(initialMode); // "login", "register", "otp", "profile"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP inputs (6 individual digits)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputsRef = useRef([]);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    } else if (isAuthenticated) {
      setMode("profile");
    } else {
      setMode("login");
    }
    setErrorMsg("");
    setSuccessMsg("");
  }, [initialMode, isOpen, isAuthenticated, user]);

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (mode === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, otpTimer]);

  if (!isOpen) return null;

  // Real-time password requirement evaluations
  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passDigit = /[0-9]/.test(password);
  const passSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = passLength && passUpper && passLower && passDigit;

  // Handle Form Submit for Login or Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (mode === "register") {
      if (!isPasswordValid) {
        setErrorMsg("Please ensure password satisfies all security requirements.");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await register(name || "Echo User", email, password);
        if (res && res.requiresOtp) {
          setMode("otp");
          setOtpTimer(60);
          setCanResend(false);
          setOtpDigits(["", "", "", "", "", ""]);
          const devHint = res?.devOtp ? ` (Dev Code: ${res.devOtp})` : "";
          setSuccessMsg(`We sent a 6-digit verification code to ${email}${devHint}`);
          setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
        } else {
          setSuccessMsg("Welcome! Account created successfully.");
          setTimeout(() => {
            onClose();
          }, 400);
        }
      } catch (err) {
        setErrorMsg(err.message || "Registration failed. Please check credentials.");
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === "login") {
      setIsSubmitting(true);
      try {
        await login(email, password);
        onClose();
      } catch (err) {
        // If account requires OTP verification
        if (err.data && err.data.requiresOtp) {
          setMode("otp");
          setOtpTimer(60);
          setCanResend(false);
          setOtpDigits(["", "", "", "", "", ""]);
          const devHint = err.data?.devOtp ? ` (Dev Code: ${err.data.devOtp})` : "";
          setSuccessMsg(`Please verify your email. A fresh 6-digit code has been sent.${devHint}`);
          setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
        } else {
          setErrorMsg(err.message || "Invalid email or password.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle 6-digit OTP change & auto-advance
  const handleOtpChange = (index, value) => {
    const val = value.slice(-1); // Only take latest char
    if (val && !/^[0-9]$/.test(val)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle OTP Backspace key
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim().slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      const newDigits = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIdx]?.focus();
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter all 6 digits of your verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(email, fullOtp);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Invalid or expired verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await resendOtp(email);
      setOtpTimer(60);
      setCanResend(false);
      const devHint = res?.devOtp ? ` (Dev Code: ${res.devOtp})` : "";
      setSuccessMsg(`A new code was sent to ${email}${devHint}`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await logout();
      if (onLogout) onLogout();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Could not sign out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      await demoLogin();
      setSuccessMsg("Welcome to Demo Mode! Entering workspace...");
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      setErrorMsg(err.message || "Could not launch demo account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md p-5 sm:p-8 rounded-3xl bg-white dark:bg-[#121321] border border-slate-200 dark:border-white/10 shadow-2xl text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* 1. User Authenticated Profile View (shown when explicitly requested or profile icon clicked) */}
        {mode === "profile" && isAuthenticated && user ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <User size={32} />
            </div>
            <h3 className="text-xl font-bold">Your Echo Workspace</h3>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left space-y-1 text-sm">
              <p className="text-slate-500 dark:text-slate-400">
                Name: <span className="text-slate-900 dark:text-white font-medium">{user.name}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Email: <span className="text-slate-900 dark:text-white font-medium">{user.email}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-white/10 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck size={14} /> Verified Account & Secure JWT Cookie
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              >
                Switch Account
              </button>
              <button
                onClick={handleSignOut}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        ) : mode === "otp" ? (
          /* 2. OTP Verification View */
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Mail size={24} />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Verify Your Email</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter the 6-digit verification code sent via Nodemailer to:
              </p>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-0.5 break-all">
                {email}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <XCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* 6 Individual Digit Boxes */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 on-paste" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-10 h-12 sm:w-12 sm:h-14 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-lg sm:text-2xl font-black text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all"
                  />
                ))}
              </div>

              {/* Countdown / Resend */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock size={14} className="text-amber-500" />
                  <span>Code expires in 10 mins</span>
                </div>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || isSubmitting}
                  className={`flex items-center gap-1 font-bold ${
                    canResend
                      ? "text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <RotateCcw size={13} />
                  <span>{canResend ? "Resend OTP" : `Resend in ${otpTimer}s`}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpDigits.join("").length !== 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Verify & Launch Workspace</span>
                <ArrowRight size={16} />
              </button>

              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
                Can't find the email? Please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
              </p>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ← Back to registration
              </button>
            </div>
          </div>
        ) : (
          /* 3. Login / Register Form */
          <div>
            {/* Tab Switcher */}
            <div className="flex p-1 mb-5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-white dark:bg-[#1a1b2b] text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-white dark:bg-[#1a1b2b] text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Create Account (OTP)
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight">
                {mode === "register" ? "Create Your Account" : "Sign In to Echo"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {mode === "register"
                  ? "Sign up to verify your email and securely sync your voice notes."
                  : "Welcome back! Enter your email and password to access your workspace."}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <XCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aditya Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Password Requirements Checklist (Register Mode) */}
              {mode === "register" && (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] space-y-1.5">
                  <p className="font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Password Security Requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${passLength ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                      {passLength ? <CheckCircle2 size={13} /> : <span className="w-3 h-3 rounded-full border border-slate-400" />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passUpper ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                      {passUpper ? <CheckCircle2 size={13} /> : <span className="w-3 h-3 rounded-full border border-slate-400" />}
                      <span>1 Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passLower ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                      {passLower ? <CheckCircle2 size={13} /> : <span className="w-3 h-3 rounded-full border border-slate-400" />}
                      <span>1 Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passDigit ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}`}>
                      {passDigit ? <CheckCircle2 size={13} /> : <span className="w-3 h-3 rounded-full border border-slate-400" />}
                      <span>1 Digit (0-9)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-0.5">
                    * Special characters (e.g. !@#$) are optional.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (mode === "register" && !isPasswordValid)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {mode === "register" ? <UserPlus size={16} /> : <LogIn size={16} />}
                <span>{mode === "register" ? "Send Verification Code" : "Sign In"}</span>
              </button>

              {/* Instant 1-Click Demo Account Access */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">or</span>
                <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={handleDemoAccess}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Sparkles size={15} />
                <span>Instant Demo Access (No Setup Required)</span>
              </button>
            </form>

            <div className="text-center mt-5">
              <button
                onClick={() => {
                  setMode(mode === "register" ? "login" : "register");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                {mode === "register"
                  ? "Already have an account? Sign In"
                  : "Don't have an account yet? Create Account (with OTP)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
