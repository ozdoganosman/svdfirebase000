"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getAllSettings,
  getPublicSiteSettings,
  SiteSettings,
  PricingSettings,
  SiteInfoSettings,
  getCurrentUserRole,
  UserRoleInfo,
} from "../lib/settings-api";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

type SettingsContextType = {
  settings: Record<string, SiteSettings> | null;
  pricingSettings: PricingSettings | null;
  siteSettings: SiteInfoSettings | null;
  categories: Category[];
  userRole: UserRoleInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, SiteSettings> | null>(null);
  const [publicSiteSettings, setPublicSiteSettings] = useState<SiteInfoSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userRole, setUserRole] = useState<UserRoleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load public site settings (no auth required) - for header/footer
  const loadPublicSiteSettings = async () => {
    try {
      const pubSettings = await getPublicSiteSettings();
      setPublicSiteSettings(pubSettings);
    } catch (err) {
      console.error("Failed to load public site settings:", err);
      // Don't set error - use defaults
    }
  };

  // Load categories (no auth required) - for header navigation
  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      // Don't set error - use empty array
    }
  };

  // Load all settings (requires auth) - for admin pages
  const refreshSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allSettings = await getAllSettings();
      setSettings(allSettings);
    } catch (err) {
      console.error("Failed to load settings:", err);
      // Don't set error for auth failures - just use public settings
      if (err instanceof Error && !err.message.includes("Yetkisiz")) {
        setError(err.message);
      }
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
    // Load public data immediately (no auth needed)
    loadPublicSiteSettings();
    loadCategories();

    // Try to load all settings and user role (requires auth)
    const initialize = async () => {
      await Promise.all([refreshSettings(), refreshUserRole()]);
    };

    initialize();
  }, []);

  // Extract specific settings for convenience
  // Use public settings as fallback if user is not authenticated
  const pricingSettings = settings?.pricing as PricingSettings | null;
  const siteSettings = (settings?.site as SiteInfoSettings | null) || publicSiteSettings;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        pricingSettings,
        siteSettings,
        categories,
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
