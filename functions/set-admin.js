import admin from "firebase-admin";

// Initialize with default credentials (uses GOOGLE_APPLICATION_CREDENTIALS or ADC)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "svdfirebase000",
  });
}

const db = admin.firestore();

async function setAdminRole() {
  const userId = "J5AqTNUNgBbyygZlbF98Uiyk0dG3"; // osmnozdgn@gmail.com

  const roleData = {
    role: "super_admin",
    permissions: {
      manageSettings: true,
      manageProducts: true,
      manageOrders: true,
      manageUsers: true,
      manageRoles: true,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: "system",
  };

  try {
    await db.collection("adminRoles").doc(userId).set(roleData);
    console.log("Admin role set successfully for osmnozdgn@gmail.com");
    console.log("User ID:", userId);
    console.log("Role:", roleData.role);
    process.exit(0);
  } catch (error) {
    console.error("Error setting admin role:", error.message);
    process.exit(1);
  }
}

setAdminRole();
