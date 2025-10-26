/**
 * Payments Database Operations
 * Handles CRUD operations for payment records
 */

const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = admin.firestore;

const paymentsCollection = db.collection("payments");

/**
 * Create a new payment record
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} Created payment document
 */
const createPayment = async (paymentData) => {
  try {
    const payment = {
      orderId: paymentData.orderId || null,
      userId: paymentData.userId || null,
      paymentToken: paymentData.paymentToken || "",
      merchantOid: paymentData.merchantOid || "",
      amount: paymentData.amount || 0, // TRY
      amountUsd: paymentData.amountUsd || 0, // USD
      exchangeRate: paymentData.exchangeRate || 0,
      status: paymentData.status || "pending", // pending, success, failed, cancelled
      paymentMethod: paymentData.paymentMethod || "credit_card",
      installment: paymentData.installment || 1,
      paytrTransactionId: paymentData.paytrTransactionId || null,
      errorMessage: paymentData.errorMessage || null,
      ipAddress: paymentData.ipAddress || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await paymentsCollection.add(payment);
    const doc = await docRef.get();

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

/**
 * Get payment by ID
 * @param {string} paymentId - Payment document ID
 * @returns {Promise<Object|null>} Payment document or null
 */
const getPaymentById = async (paymentId) => {
  try {
    const doc = await paymentsCollection.doc(paymentId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting payment:", error);
    throw error;
  }
};

/**
 * Get payment by merchant order ID
 * @param {string} merchantOid - Unique merchant order ID
 * @returns {Promise<Object|null>} Payment document or null
 */
const getPaymentByMerchantOid = async (merchantOid) => {
  try {
    const snapshot = await paymentsCollection
      .where("merchantOid", "==", merchantOid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting payment by merchantOid:", error);
    throw error;
  }
};

/**
 * Get payments by order ID
 * @param {string} orderId - Order document ID
 * @returns {Promise<Array>} Array of payment documents
 */
const getPaymentsByOrderId = async (orderId) => {
  try {
    const snapshot = await paymentsCollection
      .where("orderId", "==", orderId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting payments by orderId:", error);
    throw error;
  }
};

/**
 * Get payments by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of payment documents
 */
const getPaymentsByUserId = async (userId) => {
  try {
    const snapshot = await paymentsCollection
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting payments by userId:", error);
    throw error;
  }
};

/**
 * Update payment status
 * @param {string} paymentId - Payment document ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update
 * @returns {Promise<Object>} Updated payment document
 */
const updatePaymentStatus = async (paymentId, status, additionalData = {}) => {
  try {
    const updateData = {
      status,
      ...additionalData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await paymentsCollection.doc(paymentId).update(updateData);

    const doc = await paymentsCollection.doc(paymentId).get();
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

/**
 * Update payment by merchant order ID
 * @param {string} merchantOid - Merchant order ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated payment document
 */
const updatePaymentByMerchantOid = async (merchantOid, updateData) => {
  try {
    const payment = await getPaymentByMerchantOid(merchantOid);

    if (!payment) {
      throw new Error(`Payment not found for merchantOid: ${merchantOid}`);
    }

    await paymentsCollection.doc(payment.id).update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await paymentsCollection.doc(payment.id).get();
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error updating payment by merchantOid:", error);
    throw error;
  }
};

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentByMerchantOid,
  getPaymentsByOrderId,
  getPaymentsByUserId,
  updatePaymentStatus,
  updatePaymentByMerchantOid,
};
