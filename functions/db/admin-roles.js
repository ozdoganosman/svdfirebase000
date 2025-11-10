import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

// Collection reference
const adminRolesCollection = db.collection("adminRoles");

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

// Map admin role document
const mapAdminRoleDoc = (doc) => {
  if (!doc.exists) return null;

  const data = doc.data();
  return {
    userId: doc.id,
    role: data.role || "viewer",
    permissions: data.permissions || {},
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
    createdBy: data.createdBy || null,
    updatedBy: data.updatedBy || null,
  };
};

/**
 * Get admin role by user ID
 */
export const getAdminRole = async (userId) => {
  const doc = await adminRolesCollection.doc(userId).get();
  return mapAdminRoleDoc(doc);
};

/**
 * Check if user has a specific role
 */
export const hasRole = async (userId, role) => {
  const adminRole = await getAdminRole(userId);
  if (!adminRole) return false;

  if (Array.isArray(role)) {
    return role.includes(adminRole.role);
  }

  return adminRole.role === role;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = async (userId) => {
  return hasRole(userId, "super_admin");
};

/**
 * Check if user is admin (admin or super_admin)
 */
export const isAdmin = async (userId) => {
  return hasRole(userId, ["super_admin", "admin"]);
};

/**
 * Check if user is staff (any admin role)
 */
export const isStaff = async (userId) => {
  const adminRole = await getAdminRole(userId);
  return adminRole !== null;
};

/**
 * Get all admin users
 */
export const getAllAdmins = async () => {
  const snapshot = await adminRolesCollection.orderBy("createdAt", "desc").get();
  return snapshot.docs.map(mapAdminRoleDoc);
};

/**
 * Get admins by role
 */
export const getAdminsByRole = async (role) => {
  const snapshot = await adminRolesCollection
    .where("role", "==", role)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(mapAdminRoleDoc);
};

/**
 * Create or update admin role
 */
export const setAdminRole = async (userId, roleData, adminUserId = "system") => {
  const now = FieldValue.serverTimestamp();
  const docRef = adminRolesCollection.doc(userId);
  const existingDoc = await docRef.get();

  const data = {
    role: roleData.role || "viewer",
    permissions: roleData.permissions || getDefaultPermissions(roleData.role || "viewer"),
    updatedAt: now,
    updatedBy: adminUserId,
  };

  if (!existingDoc.exists) {
    data.createdAt = now;
    data.createdBy = adminUserId;
  }

  await docRef.set(data, { merge: true });
  return getAdminRole(userId);
};

/**
 * Delete admin role
 */
export const deleteAdminRole = async (userId) => {
  await adminRolesCollection.doc(userId).delete();
  return { success: true };
};

/**
 * Get default permissions for a role
 */
export const getDefaultPermissions = (role) => {
  const permissions = {
    super_admin: {
      manageSettings: true,
      manageProducts: true,
      manageOrders: true,
      manageUsers: true,
      manageRoles: true,
      manageCampaigns: true,
      manageContent: true,
      viewReports: true,
      viewLogs: true,
    },
    admin: {
      manageSettings: false,
      manageProducts: true,
      manageOrders: true,
      manageUsers: false,
      manageRoles: false,
      manageCampaigns: true,
      manageContent: true,
      viewReports: true,
      viewLogs: false,
    },
    editor: {
      manageSettings: false,
      manageProducts: true,
      manageOrders: false,
      manageUsers: false,
      manageRoles: false,
      manageCampaigns: false,
      manageContent: true,
      viewReports: false,
      viewLogs: false,
    },
    viewer: {
      manageSettings: false,
      manageProducts: false,
      manageOrders: false,
      manageUsers: false,
      manageRoles: false,
      manageCampaigns: false,
      manageContent: false,
      viewReports: true,
      viewLogs: false,
    },
  };

  return permissions[role] || permissions.viewer;
};

/**
 * Check if user has specific permission
 */
export const hasPermission = async (userId, permission) => {
  const adminRole = await getAdminRole(userId);
  if (!adminRole) return false;

  return adminRole.permissions[permission] === true;
};

/**
 * Update admin permissions
 */
export const updatePermissions = async (userId, permissions, adminUserId = "system") => {
  const docRef = adminRolesCollection.doc(userId);
  const existingDoc = await docRef.get();

  if (!existingDoc.exists) {
    throw new Error("Admin role not found");
  }

  await docRef.update({
    permissions: { ...existingDoc.data().permissions, ...permissions },
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: adminUserId,
  });

  return getAdminRole(userId);
};
