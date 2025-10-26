import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

// Collection references
const usersCollection = db.collection("users");

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

// Map user document
const mapUserDoc = (doc) => {
  if (!doc.exists) return null;

  const data = doc.data();
  return {
    uid: doc.id,
    email: data.email || "",
    displayName: data.displayName || "",
    phone: data.phone || "",
    company: data.company || "",
    taxNumber: data.taxNumber || "",
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

// Map address document
const mapAddressDoc = (doc) => {
  if (!doc.exists) return null;

  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || "",
    fullName: data.fullName || "",
    phone: data.phone || "",
    address: data.address || "",
    city: data.city || "",
    district: data.district || "",
    postalCode: data.postalCode || "",
    isDefault: data.isDefault || false,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

/**
 * Create a new user document in Firestore
 * This is typically called when a new user registers
 */
const createUser = async (uid, userData) => {
  const userRef = usersCollection.doc(uid);

  const data = {
    email: userData.email || "",
    displayName: userData.displayName || userData.name || "",
    phone: userData.phone || "",
    company: userData.company || "",
    taxNumber: userData.taxNumber || "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await userRef.set(data);
  return { uid, ...data };
};

/**
 * Get user by UID
 */
const getUserById = async (uid) => {
  const doc = await usersCollection.doc(uid).get();
  return mapUserDoc(doc);
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  const snapshot = await usersCollection
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return mapUserDoc(snapshot.docs[0]);
};

/**
 * Update user profile
 */
const updateUser = async (uid, updates) => {
  const userRef = usersCollection.doc(uid);

  const allowedFields = ["displayName", "phone", "company", "taxNumber"];
  const data = {};

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  });

  data.updatedAt = FieldValue.serverTimestamp();

  await userRef.update(data);
  return getUserById(uid);
};

/**
 * Delete user
 */
const deleteUser = async (uid) => {
  const userRef = usersCollection.doc(uid);

  // Delete all addresses first
  const addressesSnapshot = await userRef.collection("addresses").get();
  const batch = db.batch();
  addressesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Delete user document
  batch.delete(userRef);
  await batch.commit();

  return { success: true };
};

// ==================== ADDRESS MANAGEMENT ====================

/**
 * Get all addresses for a user
 */
const getUserAddresses = async (uid) => {
  const addressesRef = usersCollection.doc(uid).collection("addresses");
  const snapshot = await addressesRef.orderBy("createdAt", "desc").get();

  return snapshot.docs.map(mapAddressDoc);
};

/**
 * Get a specific address by ID
 */
const getAddressById = async (uid, addressId) => {
  const addressRef = usersCollection
    .doc(uid)
    .collection("addresses")
    .doc(addressId);

  const doc = await addressRef.get();
  return mapAddressDoc(doc);
};

/**
 * Create a new address
 */
const createAddress = async (uid, addressData) => {
  const addressesRef = usersCollection.doc(uid).collection("addresses");

  // Check if this is the first address - if so, make it default
  const existingAddresses = await addressesRef.get();
  const isFirstAddress = existingAddresses.empty;

  const data = {
    title: addressData.title || "",
    fullName: addressData.fullName || "",
    phone: addressData.phone || "",
    address: addressData.address || "",
    city: addressData.city || "",
    district: addressData.district || "",
    postalCode: addressData.postalCode || "",
    // If first address OR explicitly set as default, make it default
    isDefault: isFirstAddress || addressData.isDefault || false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // If this is set as default, unset all other defaults
  if (data.isDefault) {
    const defaultAddresses = await addressesRef.where("isDefault", "==", true).get();
    const batch = db.batch();
    defaultAddresses.docs.forEach(doc => {
      batch.update(doc.ref, { isDefault: false });
    });
    await batch.commit();
  }

  const docRef = await addressesRef.add(data);
  return { id: docRef.id, ...data };
};

/**
 * Update an address
 */
const updateAddress = async (uid, addressId, updates) => {
  const addressRef = usersCollection
    .doc(uid)
    .collection("addresses")
    .doc(addressId);

  const allowedFields = [
    "title", "fullName", "phone", "address",
    "city", "district", "postalCode", "isDefault"
  ];

  const data = {};
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  });

  data.updatedAt = FieldValue.serverTimestamp();

  // If this is set as default, unset all other defaults
  if (data.isDefault === true) {
    const addressesRef = usersCollection.doc(uid).collection("addresses");
    const existingAddresses = await addressesRef.where("isDefault", "==", true).get();
    const batch = db.batch();
    existingAddresses.docs.forEach(doc => {
      if (doc.id !== addressId) {
        batch.update(doc.ref, { isDefault: false });
      }
    });
    await batch.commit();
  }

  await addressRef.update(data);
  return getAddressById(uid, addressId);
};

/**
 * Delete an address
 */
const deleteAddress = async (uid, addressId) => {
  const addressRef = usersCollection
    .doc(uid)
    .collection("addresses")
    .doc(addressId);

  await addressRef.delete();
  return { success: true };
};

/**
 * Set an address as default
 */
const setDefaultAddress = async (uid, addressId) => {
  const addressesRef = usersCollection.doc(uid).collection("addresses");

  // Unset all defaults
  const existingAddresses = await addressesRef.where("isDefault", "==", true).get();
  const batch = db.batch();
  existingAddresses.docs.forEach(doc => {
    batch.update(doc.ref, { isDefault: false });
  });

  // Set the new default
  const targetRef = addressesRef.doc(addressId);
  batch.update(targetRef, {
    isDefault: true,
    updatedAt: FieldValue.serverTimestamp()
  });

  await batch.commit();
  return getAddressById(uid, addressId);
};

/**
 * Get default address
 */
const getDefaultAddress = async (uid) => {
  const addressesRef = usersCollection.doc(uid).collection("addresses");
  const snapshot = await addressesRef.where("isDefault", "==", true).limit(1).get();

  if (snapshot.empty) return null;
  return mapAddressDoc(snapshot.docs[0]);
};

export {
  // User operations
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,

  // Address operations
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
};
