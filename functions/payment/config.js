/**
 * PayTR Configuration
 * Manages PayTR credentials and settings
 */

import { getSiteSettings } from "../db/settings.js";

// Cache for PayTR settings
let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get PayTR config from Firestore settings
 * Falls back to environment variables if not available
 */
export const getPayTRConfig = async () => {
  // Check cache
  const now = Date.now();
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  // Try to get settings from Firestore
  let paymentSettings = null;
  try {
    paymentSettings = await getSiteSettings("payment");
  } catch (error) {
    console.warn("Could not fetch payment settings from Firestore:", error.message);
  }

  // Determine site URL based on environment
  const siteUrl = process.env.SITE_URL || "https://svdfirebase000.web.app";
  const apiUrl = process.env.API_URL || "https://api-tfi7rlxtca-uc.a.run.app";

  const config = {
    merchant_id: paymentSettings?.paytrMerchantId || process.env.PAYTR_MERCHANT_ID || "",
    merchant_key: paymentSettings?.paytrMerchantKey || process.env.PAYTR_MERCHANT_KEY || "",
    merchant_salt: paymentSettings?.paytrMerchantSalt || process.env.PAYTR_MERCHANT_SALT || "",
    test_mode: paymentSettings?.paytrTestMode ?? (process.env.PAYTR_TEST_MODE === "true"),
    enabled: paymentSettings?.paytrEnabled ?? false,
    callback_url: process.env.PAYTR_CALLBACK_URL || `${apiUrl}/payment/callback`,
    success_url: process.env.PAYTR_SUCCESS_URL || `${siteUrl}/checkout/success`,
    fail_url: process.env.PAYTR_FAIL_URL || `${siteUrl}/checkout/failed`,
  };

  // Validate required fields
  if (!config.merchant_id || !config.merchant_key || !config.merchant_salt) {
    throw new Error(
      "PayTR credentials are missing. Please configure in Admin Panel > Payment Settings.",
    );
  }

  // Cache the settings
  cachedSettings = config;
  cacheTimestamp = now;

  return config;
};

/**
 * Synchronous version for backward compatibility (uses cached value)
 */
export const getPayTRConfigSync = () => {
  if (!cachedSettings) {
    // Return from env if no cache
    return {
      merchant_id: process.env.PAYTR_MERCHANT_ID || "",
      merchant_key: process.env.PAYTR_MERCHANT_KEY || "",
      merchant_salt: process.env.PAYTR_MERCHANT_SALT || "",
      test_mode: process.env.PAYTR_TEST_MODE === "true",
      enabled: false,
      callback_url: process.env.PAYTR_CALLBACK_URL || "",
      success_url: process.env.PAYTR_SUCCESS_URL || "",
      fail_url: process.env.PAYTR_FAIL_URL || "",
    };
  }
  return cachedSettings;
};

/**
 * Get PayTR API URL
 * @returns {string} PayTR API endpoint
 */
export const getPayTRApiUrl = () => {
  // PayTR uses the same URL for both test and production
  // Test mode is controlled by test card usage
  return "https://www.paytr.com/odeme/api/get-token";
};

/**
 * Get PayTR iframe URL
 * @param {string} token - Payment token
 * @returns {string} PayTR iframe URL
 */
export const getPayTRIframeUrl = (token) => {
  return `https://www.paytr.com/odeme/guvenli/${token}`;
};
