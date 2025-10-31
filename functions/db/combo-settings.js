import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

// Collection reference
const comboSettingsCollection = db.collection("comboDiscountSettings");
const SETTINGS_DOC_ID = "global"; // Single document for global settings

/**
 * Get combo discount settings
 * @returns {Promise<Object|null>} Combo settings or null if not found
 */
export const getComboSettings = async () => {
  const doc = await comboSettingsCollection.doc(SETTINGS_DOC_ID).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    isActive: data.isActive ?? false,
    discountType: data.discountType || "percentage", // "percentage" | "fixed"
    discountValue: Number(data.discountValue ?? 0), // %10 or $0.02
    applicableTypes: data.applicableTypes || ["başlık", "şişe"],
    requireSameNeckSize: data.requireSameNeckSize ?? true,
    minQuantity: Number(data.minQuantity ?? 0), // minimum combo quantity
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
  };
};

/**
 * Create or update combo discount settings
 * @param {Object} settings - Combo settings
 * @returns {Promise<Object>} Updated settings
 */
export const setComboSettings = async (settings) => {
  const now = FieldValue.serverTimestamp();

  const doc = await comboSettingsCollection.doc(SETTINGS_DOC_ID).get();
  const isNew = !doc.exists;

  const settingsData = {
    isActive: settings.isActive ?? false,
    discountType: settings.discountType || "percentage",
    discountValue: Number(settings.discountValue ?? 0),
    applicableTypes: settings.applicableTypes || ["başlık", "şişe"],
    requireSameNeckSize: settings.requireSameNeckSize ?? true,
    minQuantity: Number(settings.minQuantity ?? 0),
    updatedAt: now,
  };

  if (isNew) {
    settingsData.createdAt = now;
  }

  await comboSettingsCollection.doc(SETTINGS_DOC_ID).set(settingsData, { merge: true });

  return getComboSettings();
};

/**
 * Initialize default combo settings if not exists
 * @returns {Promise<Object>} Settings
 */
export const initializeComboSettings = async () => {
  const existing = await getComboSettings();

  if (existing) {
    return existing;
  }

  // Create default settings
  const defaultSettings = {
    isActive: false, // Disabled by default
    discountType: "percentage",
    discountValue: 10, // 10% default discount
    applicableTypes: ["başlık", "şişe"],
    requireSameNeckSize: true,
    minQuantity: 100, // minimum 100 pieces for combo
  };

  return setComboSettings(defaultSettings);
};

/**
 * Toggle combo discount active status
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>} Updated settings
 */
export const toggleComboActive = async (isActive) => {
  const existing = await getComboSettings();

  if (!existing) {
    throw new Error("Combo settings not found. Initialize first.");
  }

  return setComboSettings({ ...existing, isActive });
};
