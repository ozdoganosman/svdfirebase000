import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

// Collection references
const samplesCollection = db.collection("samples");

const mapTimestamp = (value) => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  // Firestore Timestamp objesini Date objesine dönüştür
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(value).toISOString();
};

// Generate unique sample number (NUM-YYYYMMDD-XXXX)
const generateSampleNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

  // Count today's samples
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const todaySamples = await samplesCollection
    .where("createdAt", ">=", startOfDay)
    .where("createdAt", "<", endOfDay)
    .get();

  const sampleCount = todaySamples.size + 1;
  const paddedCount = sampleCount.toString().padStart(4, "0");

  return `NUM-${dateStr}-${paddedCount}`;
};

const mapSampleDoc = (doc) => {
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();

  // Support both old and new formats
  const isCartBased = Array.isArray(data.items);

  if (isCartBased) {
    return {
      id: doc.id,
      sampleNumber: data.sampleNumber || null,
      customer: data.customer || {},
      items: data.items || [],
      shippingFee: data.shippingFee || 200,
      status: data.status || "requested",
      notes: data.notes || "",
      trackingNumber: data.trackingNumber || "",
      carrier: data.carrier || "",
      createdAt: mapTimestamp(data.createdAt),
      updatedAt: mapTimestamp(data.updatedAt),
    };
  }

  // Old format (single product) - convert to new format for frontend compatibility
  return {
    id: doc.id,
    sampleNumber: null,
    customer: {
      name: data.name || "",
      company: data.company || "",
      email: data.email || "",
      phone: data.phone || "",
      userId: null,
    },
    items: data.product ? [{
      id: doc.id,
      title: data.product,
      quantity: data.quantity ? parseInt(data.quantity, 10) || 1 : 1,
    }] : [],
    shippingFee: 200,
    status: data.status || "requested",
    notes: data.notes || "",
    trackingNumber: data.trackingNumber || "",
    carrier: data.carrier || "",
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

// OLD: Single product sample request (legacy)
const createSampleRequest = async (payload) => {
  const {
    name = "",
    company = "",
    email = "",
    phone = "",
    product = "",
    quantity = "",
    notes = "",
  } = payload;

  const now = FieldValue.serverTimestamp();
  const sampleData = {
    name,
    company,
    email,
    phone,
    product,
    quantity,
    notes,
    status: "requested",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await samplesCollection.add(sampleData);
  const doc = await docRef.get();
  return mapSampleDoc(doc);
};

// NEW: Cart-based sample request (multiple products, 2 pcs each, 200 TL shipping)
const createSampleFromCart = async (payload) => {
  const {
    customer = {},
    items = [],  // Cart items
    notes = "",
  } = payload;

  const sampleNumber = await generateSampleNumber();
  const now = FieldValue.serverTimestamp();

  // Each item gets quantity = 2
  const sampleItems = items.map(item => ({
    id: item.id || "",
    title: item.title || "",
    quantity: 2,  // Always 2 pieces per product
  }));

  const sampleData = {
    sampleNumber,
    customer: {
      name: customer.name || "",
      company: customer.company || "",
      email: customer.email || "",
      phone: customer.phone || "",
      userId: customer.userId || null,
    },
    items: sampleItems,
    shippingFee: 200,  // Fixed 200 TL (KDV dahil)
    status: "requested",
    notes: notes || "",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await samplesCollection.add(sampleData);
  const doc = await docRef.get();
  return mapSampleDoc(doc);
};

// Get sample by ID
const getSampleById = async (sampleId) => {
  const doc = await samplesCollection.doc(sampleId).get();
  return mapSampleDoc(doc);
};

// Get samples by customer userId
const getSamplesByCustomer = async (userId) => {
  const snapshot = await samplesCollection
    .where("customer.userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(mapSampleDoc).filter(Boolean);
};

// Update sample status
const updateSampleStatus = async (sampleId, status, shippingInfo = {}) => {
  const docRef = samplesCollection.doc(sampleId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("Sample not found");
  }

  const updateData = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Add shipping info if provided (for shipped status)
  if (shippingInfo.trackingNumber) {
    updateData.trackingNumber = shippingInfo.trackingNumber;
  }
  if (shippingInfo.carrier) {
    updateData.carrier = shippingInfo.carrier;
  }

  await docRef.update(updateData);

  const updatedDoc = await docRef.get();
  return mapSampleDoc(updatedDoc);
};

// List all samples (admin)
const listSamples = async (filters = {}) => {
  let query = samplesCollection.orderBy("createdAt", "desc");

  if (filters.status) {
    query = query.where("status", "==", filters.status);
  }

  if (filters.limit) {
    query = query.limit(Number(filters.limit) || 50);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(mapSampleDoc).filter(Boolean);
};

export {
  createSampleRequest,
  createSampleFromCart,
  getSampleById,
  getSamplesByCustomer,
  updateSampleStatus,
  listSamples,
};
