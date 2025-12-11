/**
 * PayTR Hash Generation Utilities
 * Handles HMAC-SHA256 hash calculations for PayTR API
 */

import crypto from "crypto";

/**
 * Generate PayTR payment token hash
 * Based on PayTR iFrame API documentation
 * Hash format: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt
 *
 * @param {Object} params - Payment parameters
 * @param {string} params.merchant_id - Merchant ID
 * @param {string} params.user_ip - User IP address
 * @param {string} params.merchant_oid - Unique order ID
 * @param {string} params.email - Customer email
 * @param {string} params.payment_amount - Payment amount in kuruş (TRY * 100)
 * @param {string} params.user_basket - Base64 encoded basket
 * @param {string} params.no_installment - No installment flag ("0" or "1")
 * @param {string} params.max_installment - Max installment ("0" for none)
 * @param {string} params.currency - Currency code ("TL")
 * @param {string} params.test_mode - Test mode flag ("0" or "1")
 * @param {string} params.merchant_salt - Merchant salt
 * @param {string} params.merchant_key - Merchant key
 * @returns {string} HMAC-SHA256 hash in base64
 */
export const generatePaymentTokenHash = (params) => {
  const {
    merchant_id,
    user_ip,
    merchant_oid,
    email,
    payment_amount,
    user_basket,
    no_installment,
    max_installment,
    currency,
    test_mode,
    merchant_salt,
    merchant_key,
  } = params;

  // PayTR hash format - order is critical!
  // merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt
  const hashStr =
    merchant_id +
    user_ip +
    merchant_oid +
    email +
    payment_amount +
    user_basket +
    no_installment +
    max_installment +
    currency +
    test_mode +
    merchant_salt;

  console.log("[PayTR Hash] Hash string components:", {
    merchant_id,
    user_ip,
    merchant_oid,
    email,
    payment_amount,
    user_basket: user_basket?.substring(0, 20) + "...",
    no_installment,
    max_installment,
    currency,
    test_mode,
    merchant_salt: merchant_salt?.substring(0, 4) + "***",
  });

  const paytr_token = crypto
    .createHmac("sha256", merchant_key)
    .update(hashStr)
    .digest("base64");

  return paytr_token;
};

/**
 * Verify PayTR callback hash
 * @param {string} merchantOid - Merchant order ID from callback
 * @param {string} status - Payment status from callback
 * @param {string} totalAmount - Total amount from callback
 * @param {string} hash - Hash from callback
 * @param {string} merchantKey - Merchant key
 * @param {string} merchantSalt - Merchant salt
 * @returns {boolean} True if hash is valid
 */
export const verifyCallbackHash = (
  merchantOid,
  status,
  totalAmount,
  hash,
  merchantKey,
  merchantSalt,
) => {
  const hashStr = merchantOid + merchantSalt + status + totalAmount;

  const calculatedHash = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64");

  return calculatedHash === hash;
};

/**
 * Generate merchant_oid (unique order ID)
 * Format: YYYYMMDDHHMMSSRANDOM (alphanumeric only, no special characters)
 * PayTR requires alphanumeric characters only
 * @returns {string} Unique merchant order ID
 */
export const generateMerchantOid = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  // PayTR requires alphanumeric only - no dashes or special characters
  return `SVD${date}${time}${random}`;
};

/**
 * Encode user basket for PayTR
 * @param {Array} items - Cart items
 * @param {Object} item - Cart item
 * @param {string} item.name - Product name
 * @param {number} item.price - Product price (TRY)
 * @param {number} item.quantity - Product quantity
 * @returns {string} Base64 encoded basket JSON
 */
export const encodeUserBasket = (items) => {
  const basket = items.map((item) => [
    item.name || "Ürün",
    (item.price * 100).toFixed(0), // Convert TRY to kuruş
    item.quantity || 1,
  ]);

  const basketJson = JSON.stringify(basket);
  return Buffer.from(basketJson).toString("base64");
};
