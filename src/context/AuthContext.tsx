"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = any | null;

interface AuthContextType {
  user: User;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  refreshUser: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children, initialUser }: { children: React.ReactNode, initialUser: User }) => {
  const [user, setUser] = useState<User>(initialUser);
  const router = useRouter();

  // Keep state in sync if initialUser changes from server (e.g., after router.refresh())
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
