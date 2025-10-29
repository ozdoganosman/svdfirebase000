"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { signUp, signIn, signOut, resetPassword, SignUpData, SignInData } from "@/lib/firebase-auth";
import { resolveServerApiUrl } from "@/lib/server-api";

export type VIPStatus = {
  tier: "platinum" | "gold" | "silver" | "bronze" | null;
  discount: number;
  manuallySet: boolean;
  autoCalculated: boolean;
  lastCalculatedAt?: string;
  segment?: string;
};

interface AuthContextType {
  user: User | null;
  vipStatus: VIPStatus | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refetchVIPStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vipStatus, setVipStatus] = useState<VIPStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVIPStatus = async (userId: string) => {
    try {
      const response = await fetch(resolveServerApiUrl(`/user/vip-status?userId=${userId}`));
      if (response.ok) {
        const data = await response.json();
        setVipStatus(data.vipStatus || null);
      }
    } catch (error) {
      console.error("Failed to fetch VIP status:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchVIPStatus(user.uid);
      } else {
        setVipStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignUp = async (data: SignUpData) => {
    await signUp(data);
    // User will be set automatically by onAuthStateChanged
  };

  const handleSignIn = async (data: SignInData) => {
    await signIn(data);
    // User will be set automatically by onAuthStateChanged
  };

  const handleSignOut = async () => {
    await signOut();
    // User will be set to null automatically by onAuthStateChanged
  };

  const handleResetPassword = async (email: string) => {
    await resetPassword(email);
  };

  const handleRefetchVIPStatus = async () => {
    if (user) {
      await fetchVIPStatus(user.uid);
    }
  };

  const value = {
    user,
    vipStatus,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    refetchVIPStatus: handleRefetchVIPStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
