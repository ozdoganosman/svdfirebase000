/**
 * Initialize the first super admin user
 * Usage: node init-super-admin.js <userId>
 *
 * This script creates an adminRoles document for the specified user
 * granting them super_admin privileges. Run this once after deploying
 * the new security rules to prevent lockout.
 */

import { db } from "../db/client.js";
import { FieldValue } from "firebase-admin/firestore";

const adminRolesCollection = db.collection("adminRoles");

async function initSuperAdmin(userId) {
  if (!userId) {
    console.error("❌ Error: User ID is required");
    console.log("\nUsage: node init-super-admin.js <userId>");
    console.log("\nTo get your user ID:");
    console.log("  1. Go to Firebase Console > Authentication");
    console.log("  2. Find your user and copy the UID");
    console.log("  3. Run: node init-super-admin.js <your-uid>\n");
    process.exit(1);
  }

  console.log("🔐 Initializing super admin user...\n");
  console.log(`User ID: ${userId}\n`);

  try {
    // Check if user already has a role
    const existingDoc = await adminRolesCollection.doc(userId).get();

    if (existingDoc.exists) {
      const currentRole = existingDoc.data().role;
      console.log(`⚠️  User already has a role: ${currentRole}`);

      if (currentRole === "super_admin") {
        console.log("✓ User is already a super admin. No changes needed.\n");
        return;
      }

      // Upgrade existing role to super_admin
      await adminRolesCollection.doc(userId).update({
        role: "super_admin",
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: "system",
      });

      console.log(`✅ Upgraded user from '${currentRole}' to 'super_admin'\n`);
      return;
    }

    // Create new super admin role
    await adminRolesCollection.doc(userId).set({
      role: "super_admin",
      permissions: {
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "system",
    });

    console.log("✅ Successfully created super admin role!\n");
    console.log("Permissions granted:");
    console.log("  ✓ Manage Settings");
    console.log("  ✓ Manage Products");
    console.log("  ✓ Manage Orders");
    console.log("  ✓ Manage Users");
    console.log("  ✓ Manage Roles");
    console.log("  ✓ Manage Campaigns");
    console.log("  ✓ Manage Content");
    console.log("  ✓ View Reports");
    console.log("  ✓ View Logs\n");

  } catch (error) {
    console.error("❌ Error creating super admin:", error.message);
    throw error;
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

initSuperAdmin(userId)
  .then(() => {
    console.log("🎉 Done! You can now log in with super admin privileges.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
