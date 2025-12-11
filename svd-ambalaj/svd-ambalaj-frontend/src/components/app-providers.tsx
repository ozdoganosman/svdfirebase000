"use client";

import type { PropsWithChildren } from "react";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>{children}</CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
