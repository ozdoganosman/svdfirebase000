/**
 * PayTR Configuration
 * Manages PayTR credentials and settings
 */

const getPayTRConfig = () => {
  const config = {
    merchant_id: process.env.PAYTR_MERCHANT_ID || "",
    merchant_key: process.env.PAYTR_MERCHANT_KEY || "",
    merchant_salt: process.env.PAYTR_MERCHANT_SALT || "",
    test_mode: process.env.PAYTR_TEST_MODE === "true",
    callback_url: process.env.PAYTR_CALLBACK_URL || "",
    success_url: process.env.PAYTR_SUCCESS_URL || "",
    fail_url: process.env.PAYTR_FAIL_URL || "",
  };

  // Validate required fields
  if (!config.merchant_id || !config.merchant_key || !config.merchant_salt) {
    throw new Error(
      "PayTR credentials are missing. Please check environment variables.",
    );
  }

  return config;
};

/**
 * Get PayTR API URL
 * @returns {string} PayTR API endpoint
 */
const getPayTRApiUrl = () => {
  const testMode = process.env.PAYTR_TEST_MODE === "true";
  // PayTR uses the same URL for both test and production
  // Test mode is controlled by test card usage
  return "https://www.paytr.com/odeme/api/get-token";
};

/**
 * Get PayTR iframe URL
 * @param {string} token - Payment token
 * @returns {string} PayTR iframe URL
 */
const getPayTRIframeUrl = (token) => {
  return `https://www.paytr.com/odeme/guvenli/${token}`;
};

module.exports = {
  getPayTRConfig,
  getPayTRApiUrl,
  getPayTRIframeUrl,
};
