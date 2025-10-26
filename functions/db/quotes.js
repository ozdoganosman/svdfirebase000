import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

// Collection references
const quotesCollection = db.collection("quotes");

const mapTimestamp = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(value).toISOString();
};

const parseNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

// Generate unique quote number (TKL-YYYYMMDD-XXXX)
const generateQuoteNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

  // Count today's quotes
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const todayQuotes = await quotesCollection
    .where("createdAt", ">=", startOfDay)
    .where("createdAt", "<", endOfDay)
    .get();

  const quoteCount = todayQuotes.size + 1;
  const paddedCount = quoteCount.toString().padStart(4, "0");

  return `TKL-${dateStr}-${paddedCount}`;
};

const mapQuoteDoc = (doc) => {
  if (!doc.exists) return null;

  const data = doc.data();
  const items = Array.isArray(data.items) ? data.items : [];
  const mappedItems = items.map((item) => ({
    id: item.id || "",
    title: item.title || "",
    quantity: parseNumber(item.quantity, 0),
    price: parseNumber(item.price, 0),
    subtotal: parseNumber(item.subtotal, parseNumber(item.price, 0) * parseNumber(item.quantity, 0)),
  }));

  return {
    id: doc.id,
    quoteNumber: data.quoteNumber || null,
    status: data.status || "pending",
    customer: data.customer || {},
    items: mappedItems,
    totals: data.totals || {
      subtotal: 0,
      tax: 0,
      total: 0,
      currency: "TRY",
    },
    paymentTerms: data.paymentTerms || {
      termMonths: 0,
      guaranteeType: "",
      guaranteeDetails: "",
    },
    adminNotes: data.adminNotes || "",
    validUntil: mapTimestamp(data.validUntil),
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

/**
 * Create a new quote request
 */
const createQuote = async (payload) => {
  const {
    customer = {},
    items = [],
    totals = {},
    paymentTerms = {},
  } = payload;

  const quoteNumber = await generateQuoteNumber();
  const now = FieldValue.serverTimestamp();

  // Valid for 30 days by default
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const quoteData = {
    quoteNumber,
    status: "pending",
    customer: {
      name: customer.name || "",
      company: customer.company || "",
      email: customer.email || "",
      phone: customer.phone || "",
      taxNumber: customer.taxNumber || "",
      address: customer.address || "",
      city: customer.city || "",
      userId: customer.userId || null,
    },
    items: items.map((item) => ({
      id: item.id || "",
      title: item.title || "",
      quantity: parseNumber(item.quantity, 0),
      price: parseNumber(item.price, 0),
      subtotal: parseNumber(item.subtotal, parseNumber(item.price, 0) * parseNumber(item.quantity, 0)),
    })),
    totals: {
      subtotal: parseNumber(totals.subtotal, 0),
      tax: parseNumber(totals.tax, 0),
      total: parseNumber(totals.total, 0),
      currency: totals.currency || "TRY",
    },
    paymentTerms: {
      termMonths: parseNumber(paymentTerms.termMonths, 0),
      guaranteeType: paymentTerms.guaranteeType || "",
      guaranteeDetails: paymentTerms.guaranteeDetails || "",
    },
    adminNotes: "",
    validUntil,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await quotesCollection.add(quoteData);
  const doc = await docRef.get();
  return mapQuoteDoc(doc);
};

/**
 * Get quote by ID
 */
const getQuoteById = async (quoteId) => {
  const doc = await quotesCollection.doc(quoteId).get();
  return mapQuoteDoc(doc);
};

/**
 * Get all quotes (admin)
 */
const listQuotes = async (filters = {}) => {
  let query = quotesCollection.orderBy("createdAt", "desc");

  if (filters.status) {
    query = query.where("status", "==", filters.status);
  }

  if (filters.limit) {
    query = query.limit(parseNumber(filters.limit, 50));
  }

  const snapshot = await query.get();
  return snapshot.docs.map(mapQuoteDoc).filter(Boolean);
};

/**
 * Get quotes by customer (userId)
 */
const getQuotesByCustomer = async (userId) => {
  const snapshot = await quotesCollection
    .where("customer.userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(mapQuoteDoc).filter(Boolean);
};

/**
 * Update quote status and admin notes (admin only)
 */
const updateQuote = async (quoteId, updates) => {
  const docRef = quotesCollection.doc(quoteId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("Quote not found");
  }

  const updateData = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updates.status) {
    updateData.status = updates.status;
  }

  if (updates.adminNotes !== undefined) {
    updateData.adminNotes = updates.adminNotes;
  }

  if (updates.validUntil) {
    updateData.validUntil = new Date(updates.validUntil);
  }

  await docRef.update(updateData);
  const updatedDoc = await docRef.get();
  return mapQuoteDoc(updatedDoc);
};

/**
 * Delete quote (admin only)
 */
const deleteQuote = async (quoteId) => {
  await quotesCollection.doc(quoteId).delete();
  return { success: true };
};

export {
  createQuote,
  getQuoteById,
  listQuotes,
  getQuotesByCustomer,
  updateQuote,
  deleteQuote,
};
