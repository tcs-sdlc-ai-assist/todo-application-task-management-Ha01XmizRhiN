"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, AuthResponse, LoginInput, RegisterInput } from "@/types";
import { API_ROUTES, JWT_COOKIE_NAME } from "@/constants";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(JWT_COOKIE_NAME);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(JWT_COOKIE_NAME, token);
  } catch {
    // Storage unavailable
  }
}

function removeStoredToken(): void {
  try {
    localStorage.removeItem(JWT_COOKIE_NAME);
  } catch {
    // Storage unavailable
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true;
    }
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) {
      return true;
    }
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = user !== null && token !== null;

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    removeStoredToken();
  }, []);

  const fetchCurrentUser = useCallback(async (currentToken: string): Promise<void> => {
    try {
      const response = await fetch(API_ROUTES.AUTH.ME, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        clearAuth();
        return;
      }

      const data = await response.json() as User;
      setUser(data);
      setToken(currentToken);
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();

      if (!storedToken || isTokenExpired(storedToken)) {
        clearAuth();
        setIsLoading(false);
        return;
      }

      await fetchCurrentUser(storedToken);
      setIsLoading(false);
    };

    initAuth();
  }, [clearAuth, fetchCurrentUser]);

  const login = useCallback(async (input: LoginInput): Promise<void> => {
    const response = await fetch(API_ROUTES.AUTH.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Login failed" } }));
      const message = errorData?.error?.message || errorData?.message || "Login failed";
      throw new Error(message);
    }

    const data = await response.json() as AuthResponse;
    storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<void> => {
    const response = await fetch(API_ROUTES.AUTH.REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Registration failed" } }));
      const message = errorData?.error?.message || errorData?.message || "Registration failed";
      throw new Error(message);
    }

    const data = await response.json() as AuthResponse;
    storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;