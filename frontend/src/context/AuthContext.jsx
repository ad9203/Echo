import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await api.getMe();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        // Clear invalid token if session check fails
        try {
          localStorage.removeItem("echo_auth_token");
        } catch (e) {}
        console.info("[Auth] No active session. Ready for login or guest onboarding.");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.login({ email, password });
      if (data.token) {
        localStorage.setItem("echo_auth_token", data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
      return data.user;
    } catch (err) {
      setError(err.message || "Failed to log in");
      throw err;
    }
  };

  const demoLogin = async () => {
    setError(null);
    try {
      const data = await api.demoLogin();
      if (data.token) {
        localStorage.setItem("echo_auth_token", data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
      return data.user;
    } catch (err) {
      setError(err.message || "Failed to launch demo account");
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const data = await api.register({ name, email, password });
      // If server returned token immediately (auto-verified when SMTP is absent)
      if (data.token) {
        localStorage.setItem("echo_auth_token", data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
      return data;
    } catch (err) {
      setError(err.message || "Failed to register");
      throw err;
    }
  };

  const verifyOtp = async (email, otp) => {
    setError(null);
    try {
      const data = await api.verifyOtp({ email, otp });
      if (data.token) {
        localStorage.setItem("echo_auth_token", data.token);
      }
      if (data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
      return data;
    } catch (err) {
      setError(err.message || "Failed to verify OTP");
      throw err;
    }
  };

  const resendOtp = async (email) => {
    setError(null);
    try {
      const data = await api.resendOtp(email);
      return data;
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      try {
        localStorage.removeItem("echo_auth_token");
      } catch (e) {}
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        demoLogin,
        register,
        verifyOtp,
        resendOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
