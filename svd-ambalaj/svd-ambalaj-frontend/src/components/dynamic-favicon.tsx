"use client";

import { useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";

export function DynamicFavicon() {
  const { siteSettings } = useSettings();

  useEffect(() => {
    if (!siteSettings?.faviconUrl) return;

    // Find existing favicon link or create new one
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.href = siteSettings.faviconUrl;

    // Also update apple-touch-icon if it exists
    const appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
    if (appleLink) {
      appleLink.href = siteSettings.faviconUrl;
    }
  }, [siteSettings?.faviconUrl]);

  // This component doesn't render anything
  return null;
}
