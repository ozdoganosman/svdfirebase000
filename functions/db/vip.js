import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

const usersCollection = db.collection("users");
const ordersCollection = db.collection("orders");
const quotesCollection = db.collection("quotes");

// VIP Tier Definitions
const VIP_TIERS = {
  PLATINUM: {
    name: "platinum",
    label: "Platinum",
    icon: "💎",
    discount: 20,
    minOrderValue: 50000, // TRY
    minOrderCount: 10,
    minQuoteConversion: 30, // %
  },
  GOLD: {
    name: "gold",
    label: "Gold",
    icon: "🥇",
    discount: 15,
    minOrderValue: 30000,
    minOrderCount: 7,
    minQuoteConversion: 25,
  },
  SILVER: {
    name: "silver",
    label: "Silver",
    icon: "🥈",
    discount: 10,
    minOrderValue: 15000,
    minOrderCount: 5,
    minQuoteConversion: 20,
  },
  BRONZE: {
    name: "bronze",
    label: "Bronze",
    icon: "🥉",
    discount: 5,
    minOrderValue: 5000,
    minOrderCount: 3,
    minQuoteConversion: 15,
  },
};

// Customer Segments
const CUSTOMER_SEGMENTS = {
  VIP: "vip",
  HIGH_POTENTIAL: "high-potential",
  NEW: "new",
  PASSIVE: "passive",
  STANDARD: "standard",
};

/**
 * Calculate customer statistics based on order and quote history
 */
async function calculateCustomerStats(userId) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());

  // Get all orders for the user (last 12 months)
  const ordersSnapshot = await ordersCollection
    .where("customer.id", "==", userId)
    .where("createdAt", ">=", twelveMonthsAgo)
    .where("status", "in", ["paid", "delivered", "shipped", "processing"])
    .get();

  const orders = ordersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Calculate order stats
  const totalOrdersValue = orders.reduce((sum, order) => {
    return sum + (order.totals?.total || 0);
  }, 0);

  const totalOrdersCount = orders.length;

  const firstOrder = orders.length > 0
    ? orders.reduce((earliest, order) => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const earliestDate = earliest?.toDate ? earliest.toDate() : new Date(earliest);
        return orderDate < earliestDate ? orderDate : earliest;
      }, orders[0].createdAt)
    : null;

  const lastOrder = orders.length > 0
    ? orders.reduce((latest, order) => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const latestDate = latest?.toDate ? latest.toDate() : new Date(latest);
        return orderDate > latestDate ? orderDate : latest;
      }, orders[0].createdAt)
    : null;

  // Get all quotes for the user
  const quotesSnapshot = await quotesCollection
    .where("customer.userId", "==", userId)
    .get();

  const quotes = quotesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const totalQuotesCount = quotes.length;
  const approvedQuotesCount = quotes.filter((q) => q.status === "approved").length;
  const convertedQuotesCount = quotes.filter((q) => q.status === "converted").length;

  const quoteToOrderConversion = totalQuotesCount > 0
    ? ((convertedQuotesCount / totalQuotesCount) * 100).toFixed(2)
    : 0;

  return {
    totalOrdersValue,
    totalOrdersCount,
    totalQuotesCount,
    approvedQuotesCount,
    convertedQuotesCount,
    quoteToOrderConversion: parseFloat(quoteToOrderConversion),
    firstOrderAt: firstOrder,
    lastOrderAt: lastOrder,
  };
}

/**
 * Determine VIP tier based on customer stats
 */
function determineVIPTier(stats) {
  const { totalOrdersValue, totalOrdersCount, quoteToOrderConversion } = stats;

  // Check tiers from highest to lowest
  for (const tier of [VIP_TIERS.PLATINUM, VIP_TIERS.GOLD, VIP_TIERS.SILVER, VIP_TIERS.BRONZE]) {
    if (
      totalOrdersValue >= tier.minOrderValue &&
      totalOrdersCount >= tier.minOrderCount &&
      quoteToOrderConversion >= tier.minQuoteConversion
    ) {
      return tier;
    }
  }

  return null; // No VIP tier
}

/**
 * Determine customer segment
 */
function determineSegment(stats, vipTier) {
  const { totalOrdersCount, totalQuotesCount, quoteToOrderConversion, firstOrderAt, lastOrderAt } = stats;

  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

  // VIP customers
  if (vipTier) {
    return CUSTOMER_SEGMENTS.VIP;
  }

  // New customers (first order < 3 months ago, 1-3 orders)
  if (firstOrderAt && totalOrdersCount >= 1 && totalOrdersCount <= 3) {
    const firstOrderDate = firstOrderAt.toDate ? firstOrderAt.toDate() : new Date(firstOrderAt);
    if (firstOrderDate > threeMonthsAgo) {
      return CUSTOMER_SEGMENTS.NEW;
    }
  }

  // High potential (lots of quotes, few orders)
  if (totalQuotesCount > 5 && quoteToOrderConversion < 20) {
    return CUSTOMER_SEGMENTS.HIGH_POTENTIAL;
  }

  // Passive customers (last order > 6 months ago)
  if (lastOrderAt) {
    const lastOrderDate = lastOrderAt.toDate ? lastOrderAt.toDate() : new Date(lastOrderAt);
    if (lastOrderDate < sixMonthsAgo) {
      return CUSTOMER_SEGMENTS.PASSIVE;
    }
  }

  // Default: Standard
  return CUSTOMER_SEGMENTS.STANDARD;
}

/**
 * Update VIP status for a single user
 */
async function updateUserVIPStatus(userId) {
  try {
    const stats = await calculateCustomerStats(userId);
    const vipTier = determineVIPTier(stats);
    const segment = determineSegment(stats, vipTier);

    const vipStatus = {
      tier: vipTier?.name || null,
      discount: vipTier?.discount || 0,
      manuallySet: false,
      autoCalculated: true,
      lastCalculatedAt: FieldValue.serverTimestamp(),
      stats,
      segment,
    };

    await usersCollection.doc(userId).update({
      vipStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return vipStatus;
  } catch (error) {
    console.error(`Error updating VIP status for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Manually set VIP tier for a user (admin override)
 */
async function manuallySetVIPTier(userId, tierName) {
  const tier = Object.values(VIP_TIERS).find((t) => t.name === tierName);

  if (!tier && tierName !== null) {
    throw new Error(`Invalid VIP tier: ${tierName}`);
  }

  const vipStatus = {
    tier: tierName,
    discount: tier?.discount || 0,
    manuallySet: true,
    autoCalculated: false,
    lastCalculatedAt: FieldValue.serverTimestamp(),
  };

  await usersCollection.doc(userId).update({
    vipStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return vipStatus;
}

/**
 * Calculate all customer VIP statuses (batch operation)
 * This should be run as a scheduled job
 */
async function calculateAllCustomerVIPStatuses() {
  const usersSnapshot = await usersCollection.get();
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const userDoc of usersSnapshot.docs) {
    try {
      await updateUserVIPStatus(userDoc.id);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        userId: userDoc.id,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get VIP tier information
 */
function getVIPTierInfo(tierName) {
  return Object.values(VIP_TIERS).find((t) => t.name === tierName) || null;
}

/**
 * Get all VIP tiers
 */
function getAllVIPTiers() {
  return VIP_TIERS;
}

/**
 * Get user with VIP status
 */
async function getUserWithVIPStatus(userId) {
  const userDoc = await usersCollection.doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  const data = userDoc.data();
  return {
    uid: userDoc.id,
    email: data.email || "",
    displayName: data.displayName || "",
    phone: data.phone || "",
    company: data.company || "",
    taxNumber: data.taxNumber || "",
    vipStatus: data.vipStatus || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * List all customers with VIP/segment filtering
 */
async function listCustomersWithVIP(filters = {}) {
  let query = usersCollection;

  if (filters.tier) {
    query = query.where("vipStatus.tier", "==", filters.tier);
  }

  if (filters.segment) {
    query = query.where("vipStatus.segment", "==", filters.segment);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email || "",
      displayName: data.displayName || "",
      company: data.company || "",
      vipStatus: data.vipStatus || null,
      createdAt: data.createdAt,
    };
  });
}

export {
  calculateCustomerStats,
  determineVIPTier,
  determineSegment,
  updateUserVIPStatus,
  manuallySetVIPTier,
  calculateAllCustomerVIPStatuses,
  getVIPTierInfo,
  getAllVIPTiers,
  getUserWithVIPStatus,
  listCustomersWithVIP,
  VIP_TIERS,
  CUSTOMER_SEGMENTS,
};
