"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getAllSettings,
  SiteSettings,
  PricingSettings,
  SiteInfoSettings,
  getCurrentUserRole,
  UserRoleInfo,
} from "../lib/settings-api";

type SettingsContextType = {
  settings: Record<string, SiteSettings> | null;
  pricingSettings: PricingSettings | null;
  siteSettings: SiteInfoSettings | null;
  userRole: UserRoleInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, SiteSettings> | null>(null);
  const [userRole, setUserRole] = useState<UserRoleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allSettings = await getAllSettings();
      setSettings(allSettings);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserRole = async () => {
    try {
      const role = await getCurrentUserRole();
      setUserRole(role);
    } catch (err) {
      console.error("Failed to load user role:", err);
      // Don't set error here, as user might not be authenticated
      setUserRole(null);
    }
  };

  useEffect(() => {
    // Load settings and user role on mount
    const initialize = async () => {
      await Promise.all([refreshSettings(), refreshUserRole()]);
    };

    initialize();
  }, []);

  // Extract specific settings for convenience
  const pricingSettings = settings?.pricing as PricingSettings | null;
  const siteSettings = settings?.site as SiteInfoSettings | null;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        pricingSettings,
        siteSettings,
        userRole,
        isLoading,
        error,
        refreshSettings,
        refreshUserRole,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Convenience hook for checking permissions
export function usePermissions() {
  const { userRole } = useSettings();

  return {
    isSuperAdmin: userRole?.isSuperAdmin ?? false,
    isAdmin: userRole?.isAdmin ?? false,
    isStaff: userRole?.isStaff ?? false,
    hasPermission: (permission: keyof NonNullable<UserRoleInfo["role"]>["permissions"]) => {
      return userRole?.role?.permissions?.[permission] ?? false;
    },
  };
}
