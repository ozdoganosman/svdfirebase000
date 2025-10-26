/**
 * PayTR Service Functions
 * Handles PayTR API interactions
 */

const axios = require("axios");
const { getPayTRConfig, getPayTRApiUrl, getPayTRIframeUrl } = require("./config");
const {
  generatePaymentTokenHash,
  generateMerchantOid,
  encodeUserBasket,
} = require("./hash");

/**
 * Create PayTR iframe payment token
 * @param {Object} paymentData - Payment information
 * @param {Array} paymentData.cart_items - Cart items
 * @param {Object} paymentData.customer - Customer information
 * @param {string} paymentData.customer.email - Customer email
 * @param {string} paymentData.customer.name - Customer name
 * @param {string} paymentData.customer.phone - Customer phone
 * @param {string} paymentData.customer.address - Customer address
 * @param {number} paymentData.total_amount - Total amount in TRY
 * @param {string} paymentData.ip_address - Customer IP address
 * @returns {Promise<Object>} Payment token response
 */
const createIframeToken = async (paymentData) => {
  try {
    const config = getPayTRConfig();
    const merchantOid = generateMerchantOid();

    // Convert TRY to kuruş (multiply by 100)
    const paymentAmountKurus = Math.round(paymentData.total_amount * 100).toString();

    // Encode user basket
    const userBasket = encodeUserBasket(paymentData.cart_items);

    // Generate token hash
    const paytr_token = generatePaymentTokenHash({
      merchant_id: config.merchant_id,
      merchant_oid: merchantOid,
      email: paymentData.customer.email,
      payment_amount: paymentAmountKurus,
      merchant_ok_url: config.success_url,
      merchant_fail_url: config.fail_url,
      user_name: paymentData.customer.name,
      user_address: paymentData.customer.address,
      user_phone: paymentData.customer.phone,
      merchant_salt: config.merchant_salt,
      merchant_key: config.merchant_key,
      user_basket: userBasket,
    });

    // Prepare request data
    const requestData = {
      merchant_id: config.merchant_id,
      user_ip: paymentData.ip_address,
      merchant_oid: merchantOid,
      email: paymentData.customer.email,
      payment_amount: paymentAmountKurus,
      paytr_token: paytr_token,
      user_basket: userBasket,
      debug_on: config.test_mode ? "1" : "0",
      no_installment: "1",
      max_installment: "0",
      user_name: paymentData.customer.name,
      user_address: paymentData.customer.address,
      user_phone: paymentData.customer.phone,
      merchant_ok_url: config.success_url,
      merchant_fail_url: config.fail_url,
      timeout_limit: "30",
      currency: "TL",
      test_mode: config.test_mode ? "1" : "0",
    };

    // Make API request
    const response = await axios.post(
      getPayTRApiUrl(),
      new URLSearchParams(requestData).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    // Check response
    if (response.data.status === "success") {
      return {
        success: true,
        token: response.data.token,
        iframeUrl: getPayTRIframeUrl(response.data.token),
        merchantOid: merchantOid,
      };
    } else {
      return {
        success: false,
        error: response.data.reason || "Token oluşturulamadı",
      };
    }
  } catch (error) {
    console.error("PayTR token creation error:", error);
    return {
      success: false,
      error: error.message || "PayTR ile bağlantı kurulamadı",
    };
  }
};

/**
 * Verify PayTR callback
 * @param {Object} callbackData - Callback data from PayTR
 * @param {string} callbackData.merchant_oid - Merchant order ID
 * @param {string} callbackData.status - Payment status
 * @param {string} callbackData.total_amount - Total amount
 * @param {string} callbackData.hash - Hash from PayTR
 * @returns {Object} Verification result
 */
const verifyCallback = (callbackData) => {
  try {
    const config = getPayTRConfig();
    const { verifyCallbackHash } = require("./hash");

    const isValid = verifyCallbackHash(
      callbackData.merchant_oid,
      callbackData.status,
      callbackData.total_amount,
      callbackData.hash,
      config.merchant_key,
      config.merchant_salt,
    );

    return {
      valid: isValid,
      status: callbackData.status,
      merchantOid: callbackData.merchant_oid,
    };
  } catch (error) {
    console.error("PayTR callback verification error:", error);
    return {
      valid: false,
      error: error.message,
    };
  }
};

module.exports = {
  createIframeToken,
  verifyCallback,
};
