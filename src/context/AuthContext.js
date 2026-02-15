import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_STORAGE_KEY } from "../services/config";
import services from "../services";

const AuthContext = createContext(null);

function readSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [loading, setLoading] = useState(false);

  const saveSession = useCallback((nextSession) => {
    setSession(nextSession);
    if (nextSession) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const response = await services.authService.login(credentials);
      const nextSession = {
        token: response.token,
        user: response.user,
      };
      saveSession(nextSession);
      return nextSession;
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  const logout = useCallback(async () => {
    try {
      await services.authService.logout();
    } catch (_err) {
      // best-effort logout
    }
    saveSession(null);
  }, [saveSession]);

  useEffect(() => {
    const onUnauthorized = () => {
      saveSession(null);
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [saveSession]);

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      role: session?.user?.role || null,
      isAuthenticated: Boolean(session?.token),
      isAdmin: session?.user?.role === "Admin",
      loading,
      login,
      logout,
    }),
    [session, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
