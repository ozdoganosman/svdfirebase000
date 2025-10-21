import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

// Collection references
const mediaCollection = db.collection("media");
const landingMediaCollection = db.collection("landingMedia");

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

const mapMediaDoc = (doc) => {
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  return {
    id: doc.id,
    filename: data.filename,
    originalName: data.originalName || "",
    size: Number(data.size ?? 0),
    mimeType: data.mimeType || "",
    url: data.url || "",
    storageKey: data.storageKey,
    checksum: data.checksum || null,
    metadata: data.metadata || {},
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

const listMedia = async () => {
  const snapshot = await mediaCollection.orderBy("createdAt", "desc").get();
  return snapshot.docs.map(mapMediaDoc);
};

const getMediaById = async (id) => {
  const doc = await mediaCollection.doc(id).get();
  return mapMediaDoc(doc);
};

const createMediaEntry = async (entry) => {
  const {
    id,
    storageKey,
    filename,
    originalName,
    mimeType,
    size,
    url,
    checksum = null,
    metadata = {},
  } = entry;

  const now = FieldValue.serverTimestamp();
  const mediaData = {
    storageKey,
    filename,
    originalName,
    mimeType,
    size,
    url,
    checksum,
    metadata,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = id ? mediaCollection.doc(id) : mediaCollection.doc();
  await docRef.set(mediaData);
  const doc = await docRef.get();
  return mapMediaDoc(doc);
};

const deleteMedia = async (id) => {
  const existing = await getMediaById(id);
  if (!existing) {
    return null;
  }

  await mediaCollection.doc(id).delete();
  return existing;
};

const fetchLandingMedia = async () => {
  const doc = await landingMediaCollection.doc("singleton").get(); // Tek bir belge kullanıyoruz
  if (!doc.exists) {
    return {
      id: "singleton",
      heroVideo: { src: "", poster: "" },
      heroGallery: [],
      mediaHighlights: [],
      createdAt: null,
      updatedAt: null,
    };
  }
  const data = doc.data();
  return {
    id: doc.id,
    heroVideo: data.heroVideo || { src: "", poster: "" },
    heroGallery: data.heroGallery || [],
    mediaHighlights: data.mediaHighlights || [],
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

const updateLandingMedia = async (payload) => {
  const now = FieldValue.serverTimestamp();
  const updatedData = {
    heroVideo: payload.heroVideo || { src: "", poster: "" },
    heroGallery: payload.heroGallery || [],
    mediaHighlights: payload.mediaHighlights || [],
    updatedAt: now,
  };

  // Belge yoksa oluştur, varsa güncelle
  await landingMediaCollection.doc("singleton").set(updatedData, { merge: true });
  return fetchLandingMedia();
};

export {
  listMedia,
  createMediaEntry,
  deleteMedia,
  fetchLandingMedia,
  updateLandingMedia,
};
