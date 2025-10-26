/**
 * PayTR Hash Generation Utilities
 * Handles HMAC-SHA256 hash calculations for PayTR API
 */

const crypto = require("crypto");

/**
 * Generate PayTR payment token hash
 * @param {Object} params - Payment parameters
 * @param {string} params.merchant_id - Merchant ID
 * @param {string} params.merchant_oid - Unique order ID
 * @param {string} params.email - Customer email
 * @param {string} params.payment_amount - Payment amount in kuruş (TRY * 100)
 * @param {string} params.merchant_ok_url - Success URL
 * @param {string} params.merchant_fail_url - Fail URL
 * @param {string} params.user_name - Customer name
 * @param {string} params.user_address - Customer address
 * @param {string} params.user_phone - Customer phone
 * @param {string} params.merchant_salt - Merchant salt
 * @param {string} params.merchant_key - Merchant key
 * @param {string} params.user_basket - Base64 encoded basket
 * @returns {string} HMAC-SHA256 hash
 */
const generatePaymentTokenHash = (params) => {
  const {
    merchant_id,
    merchant_oid,
    email,
    payment_amount,
    merchant_ok_url,
    merchant_fail_url,
    user_name,
    user_address,
    user_phone,
    merchant_salt,
    merchant_key,
    user_basket,
  } = params;

  // PayTR hash format
  const hashStr =
    merchant_id +
    user_basket +
    "1" + // no_installment (1 = tek çekim)
    "0" + // max_installment
    "TRY" + // currency
    "1" + // test_mode (0 = production, 1 = test - ancak prod'da da test kartı çalışır)
    merchant_oid +
    payment_amount +
    merchant_ok_url +
    merchant_fail_url +
    user_name +
    user_address +
    user_phone +
    user_basket +
    email +
    merchant_salt;

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
const verifyCallbackHash = (
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
 * Format: YYYYMMDD-HHMMSS-RANDOM
 * @returns {string} Unique merchant order ID
 */
const generateMerchantOid = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `${date}-${time}-${random}`;
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
const encodeUserBasket = (items) => {
  const basket = items.map((item) => [
    item.name || "Ürün",
    (item.price * 100).toFixed(0), // Convert TRY to kuruş
    item.quantity || 1,
  ]);

  const basketJson = JSON.stringify(basket);
  return Buffer.from(basketJson).toString("base64");
};

module.exports = {
  generatePaymentTokenHash,
  verifyCallbackHash,
  generateMerchantOid,
  encodeUserBasket,
};
