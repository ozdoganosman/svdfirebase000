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

const mapSampleDoc = (doc) => {
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || "",
    company: data.company || "",
    email: data.email || "",
    phone: data.phone || "",
    product: data.product || "",
    quantity: data.quantity || "",
    notes: data.notes || "",
    status: data.status || "requested",
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

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

export {
  createSampleRequest,
};
