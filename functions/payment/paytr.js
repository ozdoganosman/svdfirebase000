/**
 * PayTR Service Functions
 * Handles PayTR API interactions
 */

import axios from "axios";
import { getPayTRConfig, getPayTRApiUrl, getPayTRIframeUrl } from "./config.js";
import {
  generatePaymentTokenHash,
  generateMerchantOid,
  encodeUserBasket,
  verifyCallbackHash,
} from "./hash.js";

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
export const createIframeToken = async (paymentData) => {
  try {
    console.log("[PayTR] Starting createIframeToken");
    const config = await getPayTRConfig();
    console.log("[PayTR] Config loaded:", { merchant_id: config.merchant_id, test_mode: config.test_mode, enabled: config.enabled });
    const merchantOid = generateMerchantOid();
    console.log("[PayTR] Generated merchantOid:", merchantOid);

    // Convert TRY to kuruş (multiply by 100)
    const paymentAmountKurus = Math.round(paymentData.total_amount * 100).toString();

    // Encode user basket
    const userBasket = encodeUserBasket(paymentData.cart_items);

    // Define constants for hash and request
    const no_installment = "1";
    const max_installment = "0";
    const currency = "TL";
    const test_mode = config.test_mode ? "1" : "0";

    // Generate token hash - parameters must match exactly what's sent to PayTR
    const paytr_token = generatePaymentTokenHash({
      merchant_id: config.merchant_id,
      user_ip: paymentData.ip_address,
      merchant_oid: merchantOid,
      email: paymentData.customer.email,
      payment_amount: paymentAmountKurus,
      user_basket: userBasket,
      no_installment: no_installment,
      max_installment: max_installment,
      currency: currency,
      test_mode: test_mode,
      merchant_salt: config.merchant_salt,
      merchant_key: config.merchant_key,
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
      no_installment: no_installment,
      max_installment: max_installment,
      user_name: paymentData.customer.name,
      user_address: paymentData.customer.address,
      user_phone: paymentData.customer.phone,
      merchant_ok_url: config.success_url,
      merchant_fail_url: config.fail_url,
      timeout_limit: "30",
      currency: currency,
      test_mode: test_mode,
    };

    console.log("[PayTR] Making API request to:", getPayTRApiUrl());
    console.log("[PayTR] Request data:", { ...requestData, paytr_token: "[HIDDEN]" });

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

    console.log("[PayTR] API response:", response.data);

    // Check response
    if (response.data.status === "success") {
      return {
        success: true,
        token: response.data.token,
        iframeUrl: getPayTRIframeUrl(response.data.token),
        merchantOid: merchantOid,
      };
    } else {
      console.error("[PayTR] Token creation failed:", response.data.reason);
      return {
        success: false,
        error: response.data.reason || "Token oluşturulamadı",
      };
    }
  } catch (error) {
    console.error("[PayTR] Token creation error:", error.message);
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
export const verifyCallback = async (callbackData) => {
  try {
    const config = await getPayTRConfig();

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
