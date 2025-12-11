/**
 * Settings Database Operations
 * Handles siteSettings, campaigns, content, and other configuration collections
 */

import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

// Collection references
const siteSettingsCollection = db.collection("siteSettings");
const campaignsCollection = db.collection("campaigns");
const contentCollection = db.collection("content");

// Helper to map timestamps
const mapTimestamp = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(value).toISOString();
};

// ==================== SITE SETTINGS ====================

/**
 * Get site settings by section
 * @param {string} section - Settings section (pricing, site, email, payment, seo)
 */
export const getSiteSettings = async (section) => {
  const doc = await siteSettingsCollection.doc(section).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    section,
    ...data,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

/**
 * Get all site settings
 */
export const getAllSiteSettings = async () => {
  const snapshot = await siteSettingsCollection.get();
  const settings = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    settings[doc.id] = {
      section: doc.id,
      ...data,
      createdAt: mapTimestamp(data.createdAt),
      updatedAt: mapTimestamp(data.updatedAt),
    };
  });

  return settings;
};

/**
 * Create or update site settings
 * @param {string} section - Settings section
 * @param {Object} data - Settings data
 * @param {string} userId - User making the change
 */
export const setSiteSettings = async (section, data, userId = "system") => {
  const now = FieldValue.serverTimestamp();
  const docRef = siteSettingsCollection.doc(section);
  const existingDoc = await docRef.get();

  const settingsData = {
    ...data,
    updatedAt: now,
    updatedBy: userId,
  };

  if (!existingDoc.exists) {
    settingsData.createdAt = now;
    settingsData.createdBy = userId;
  }

  await docRef.set(settingsData, { merge: true });

  // Log the change
  await logSettingsChange(section, "site", data, userId);

  return getSiteSettings(section);
};

/**
 * Initialize default site settings if not exists
 */
export const initializeSiteSettings = async () => {
  const defaultSettings = {
    pricing: {
      currency: "TRY",
      taxRate: 20, // 20% KDV
      showPricesWithTax: true,
      allowGuestCheckout: false,
    },
    site: {
      siteName: "SVD Ambalaj",
      siteDescription: "Kaliteli ambalaj ürünleri",
      supportEmail: "info@svdambalaj.com",
      supportPhone: "+90 XXX XXX XX XX",
      maintenanceMode: false,
    },
    email: {
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: true,
      smtpUser: "",
      smtpPassword: "", // Should be encrypted
      fromEmail: "noreply@svdambalaj.com",
      fromName: "SVD Ambalaj",
    },
    payment: {
      paytrMerchantId: "",
      paytrMerchantKey: "", // Should be encrypted
      paytrMerchantSalt: "", // Should be encrypted
      paytrEnabled: false,
    },
    seo: {
      defaultTitle: "SVD Ambalaj - Kaliteli Ambalaj Ürünleri",
      defaultDescription: "Şişe, başlık ve daha fazlası için profesyonel ambalaj çözümleri",
      defaultKeywords: "ambalaj, şişe, başlık, pet şişe",
      googleAnalyticsId: "",
      facebookPixelId: "",
    },
    stock: {
      lowStockThreshold: 100,
      criticalStockThreshold: 20,
      allowZeroStockOrders: false,
      notifyOnLowStock: true,
      notifyEmail: "",
    },
  };

  const results = {};
  for (const [section, data] of Object.entries(defaultSettings)) {
    const existing = await getSiteSettings(section);
    if (!existing) {
      results[section] = await setSiteSettings(section, data, "system");
    } else {
      results[section] = existing;
    }
  }

  return results;
};

// ==================== CAMPAIGNS ====================

/**
 * Get campaign by ID
 */
export const getCampaign = async (campaignId) => {
  const doc = await campaignsCollection.doc(campaignId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || "",
    type: data.type || "discount", // discount, free_shipping, bundle
    description: data.description || "",
    discountType: data.discountType || "percentage", // percentage, fixed
    discountValue: Number(data.discountValue || 0),
    conditions: data.conditions || {},
    startDate: mapTimestamp(data.startDate),
    endDate: mapTimestamp(data.endDate),
    isActive: data.isActive ?? false,
    priority: Number(data.priority || 0),
    applicableProducts: data.applicableProducts || [],
    applicableCategories: data.applicableCategories || [],
    minOrderValue: Number(data.minOrderValue || 0),
    maxUses: Number(data.maxUses || 0),
    usedCount: Number(data.usedCount || 0),
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
    createdBy: data.createdBy || null,
    updatedBy: data.updatedBy || null,
  };
};

/**
 * Get all campaigns
 */
export const getAllCampaigns = async (filters = {}) => {
  let query = campaignsCollection.orderBy("priority", "desc");

  if (filters.isActive !== undefined) {
    query = query.where("isActive", "==", filters.isActive);
  }

  if (filters.type) {
    query = query.where("type", "==", filters.type);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: mapTimestamp(data.startDate),
      endDate: mapTimestamp(data.endDate),
      createdAt: mapTimestamp(data.createdAt),
      updatedAt: mapTimestamp(data.updatedAt),
    };
  });
};

/**
 * Get active campaigns
 */
export const getActiveCampaigns = async () => {
  const now = new Date();
  const campaigns = await getAllCampaigns({ isActive: true });

  // Filter by date range
  return campaigns.filter(campaign => {
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      return false;
    }
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      return false;
    }
    return true;
  });
};

/**
 * Create campaign
 */
export const createCampaign = async (campaignData, userId = "system") => {
  const now = FieldValue.serverTimestamp();

  const data = {
    name: campaignData.name || "",
    type: campaignData.type || "discount",
    description: campaignData.description || "",
    discountType: campaignData.discountType || "percentage",
    discountValue: Number(campaignData.discountValue || 0),
    conditions: campaignData.conditions || {},
    startDate: campaignData.startDate || null,
    endDate: campaignData.endDate || null,
    isActive: campaignData.isActive ?? false,
    priority: Number(campaignData.priority || 0),
    applicableProducts: campaignData.applicableProducts || [],
    applicableCategories: campaignData.applicableCategories || [],
    minOrderValue: Number(campaignData.minOrderValue || 0),
    maxUses: Number(campaignData.maxUses || 0),
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
  };

  const docRef = await campaignsCollection.add(data);
  return getCampaign(docRef.id);
};

/**
 * Update campaign
 */
export const updateCampaign = async (campaignId, updates, userId = "system") => {
  const docRef = campaignsCollection.doc(campaignId);
  const existingDoc = await docRef.get();

  if (!existingDoc.exists) {
    throw new Error("Campaign not found");
  }

  const data = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: userId,
  };

  await docRef.update(data);
  return getCampaign(campaignId);
};

/**
 * Delete campaign
 */
export const deleteCampaign = async (campaignId) => {
  await campaignsCollection.doc(campaignId).delete();
  return { success: true };
};

/**
 * Increment campaign usage
 */
export const incrementCampaignUsage = async (campaignId) => {
  const docRef = campaignsCollection.doc(campaignId);
  await docRef.update({
    usedCount: FieldValue.increment(1),
    lastUsedAt: FieldValue.serverTimestamp(),
  });
  return getCampaign(campaignId);
};

// ==================== CONTENT MANAGEMENT ====================

/**
 * Get content by section
 */
export const getContent = async (section) => {
  const doc = await contentCollection.doc(section).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    section,
    ...data,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

/**
 * Get all content
 */
export const getAllContent = async () => {
  const snapshot = await contentCollection.get();
  const content = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    content[doc.id] = {
      section: doc.id,
      ...data,
      createdAt: mapTimestamp(data.createdAt),
      updatedAt: mapTimestamp(data.updatedAt),
    };
  });

  return content;
};

/**
 * Set content for a section
 */
export const setContent = async (section, data, userId = "system") => {
  const now = FieldValue.serverTimestamp();
  const docRef = contentCollection.doc(section);
  const existingDoc = await docRef.get();

  const contentData = {
    ...data,
    updatedAt: now,
    updatedBy: userId,
  };

  if (!existingDoc.exists) {
    contentData.createdAt = now;
    contentData.createdBy = userId;
  }

  await docRef.set(contentData, { merge: true });
  return getContent(section);
};

// ==================== AUDIT LOGGING ====================

/**
 * Log settings change for audit trail
 */
const logSettingsChange = async (section, type, data, userId) => {
  try {
    await db.collection("auditLogs").add({
      type: "settings_change",
      section,
      settingsType: type,
      changes: data,
      userId,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log settings change:", error);
    // Don't throw - logging failure shouldn't prevent settings update
  }
};
