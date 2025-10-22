/**
 * Exchange Rates Database Operations
 */

import admin from "../client.js";
const db = admin.firestore();

/**
 * Save exchange rate to Firestore
 */
async function saveExchangeRate(rateData) {
  try {
    const { currency, rate, source, effectiveDate } = rateData;

    const exchangeRateRef = db.collection("exchangeRates").doc(currency);

    const data = {
      currency,
      rate,
      effectiveDate,
      source,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
    };

    await exchangeRateRef.set(data, { merge: true });

    // Also save to history
    await db.collection("exchangeRates").doc(currency).collection("history").add({
      ...data,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("[Exchange Rate DB] Saved rate:", { currency, rate, effectiveDate });

    return { success: true, data };
  } catch (error) {
    console.error("[Exchange Rate DB] Save error:", error.message);
    throw error;
  }
}

/**
 * Get current active exchange rate
 */
async function getCurrentRate(currency = "USD") {
  try {
    const doc = await db.collection("exchangeRates").doc(currency).get();

    if (!doc.exists) {
      throw new Error(`No exchange rate found for ${currency}`);
    }

    const data = doc.data();

    console.log("[Exchange Rate DB] Retrieved current rate:", { currency, rate: data.rate });

    return data;
  } catch (error) {
    console.error("[Exchange Rate DB] Get error:", error.message);
    throw error;
  }
}

/**
 * Get exchange rate history
 */
async function getRateHistory(currency = "USD", limit = 30) {
  try {
    const snapshot = await db
      .collection("exchangeRates")
      .doc(currency)
      .collection("history")
      .orderBy("savedAt", "desc")
      .limit(limit)
      .get();

    const history = [];
    snapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("[Exchange Rate DB] Retrieved history:", { currency, count: history.length });

    return history;
  } catch (error) {
    console.error("[Exchange Rate DB] History error:", error.message);
    throw error;
  }
}

/**
 * Get rate by specific date
 */
async function getRateByDate(currency = "USD", date) {
  try {
    // Try to find exact date match in history
    const snapshot = await db
      .collection("exchangeRates")
      .doc(currency)
      .collection("history")
      .where("effectiveDate", "==", date)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return doc.data();
    }

    // If not found, get closest previous date
    const prevSnapshot = await db
      .collection("exchangeRates")
      .doc(currency)
      .collection("history")
      .where("effectiveDate", "<=", date)
      .orderBy("effectiveDate", "desc")
      .limit(1)
      .get();

    if (!prevSnapshot.empty) {
      const doc = prevSnapshot.docs[0];
      console.log("[Exchange Rate DB] Using closest rate:", doc.data());
      return doc.data();
    }

    throw new Error(`No exchange rate found for date: ${date}`);
  } catch (error) {
    console.error("[Exchange Rate DB] Get by date error:", error.message);
    throw error;
  }
}

/**
 * Check if rate needs update (older than 1 day)
 */
async function needsUpdate(currency = "USD") {
  try {
    const current = await getCurrentRate(currency);

    const lastUpdate = current.lastUpdated?.toDate() || new Date(0);
    const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

    // Update if older than 12 hours
    const needs = hoursSinceUpdate > 12;

    console.log("[Exchange Rate DB] Needs update check:", {
      currency,
      hoursSinceUpdate: hoursSinceUpdate.toFixed(2),
      needs,
    });

    return needs;
  } catch {
    // If no rate exists, needs update
    console.log("[Exchange Rate DB] No rate found, needs update");
    return true;
  }
}

export {
  saveExchangeRate,
  getCurrentRate,
  getRateHistory,
  getRateByDate,
  needsUpdate,
};
