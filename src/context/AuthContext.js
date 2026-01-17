import React, { createContext, useState, useEffect, useContext } from "react";
import { authAPI } from "../api/client";
import { storage } from "../utils/storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("🔍 Checking authentication...");
    try {
      const token = await storage.getToken();
      if (token) {
        console.log("🔑 Token found, validating...");
        const response = await authAPI.getCurrentUser();
        console.log("✅ User authenticated:", response.data);
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        console.log("ℹ️ No token found");
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    console.log("🔐 Login attempt for:", username);
    try {
      const response = await authAPI.login({ username, password });
      console.log("✅ Login successful:", response.data);

      const { token, user } = response.data;

      await storage.saveToken(token);
      await storage.saveUser(user);

      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error("❌ Login failed:", error.message);
      return {
        success: false,
        error: error.message || "Login failed",
      };
    }
  };

  const signup = async (username, password) => {
    console.log("📝 Signup attempt for:", username);
    try {
      console.log("Calling authAPI.signup...");
      const response = await authAPI.signup({ username, password });
      console.log("✅ Signup successful:", response.data);

      const { token, user } = response.data;

      console.log("Saving token and user...");
      await storage.saveToken(token);
      await storage.saveUser(user);

      setUser(user);
      setIsAuthenticated(true);
      console.log("✅ User state updated");
      return { success: true };
    } catch (error) {
      console.error("❌ Signup failed:", error.message);
      return {
        success: false,
        error: error.message || "Signup failed",
      };
    }
  };

  const logout = async () => {
    console.log("👋 Logging out...");
    await storage.clearAll();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        signup,
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
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
