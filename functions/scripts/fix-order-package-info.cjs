/**
 * Migration script to fix existing orders by adding packageInfo and recalculating subtotals
 * Run with: node scripts/fix-order-package-info.js
 */

const admin = require("firebase-admin");

// Initialize with application default credentials (uses Firebase CLI authentication)
admin.initializeApp({
  projectId: "svdfirebase000"
});

const db = admin.firestore();

async function fixOrders() {
  console.log("🔄 Starting order migration...");

  const ordersRef = db.collection("orders");
  const productsRef = db.collection("products");

  // Get all orders
  const ordersSnapshot = await ordersRef.get();
  console.log(`📦 Found ${ordersSnapshot.size} orders to process`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const orderDoc of ordersSnapshot.docs) {
    const orderId = orderDoc.id;
    const orderData = orderDoc.data();

    console.log(`\n📋 Processing order: ${orderId}`);

    try {
      let needsUpdate = false;
      const updatedItems = [];

      for (const item of orderData.items || []) {
        // Skip if already has packageInfo
        if (item.packageInfo) {
          console.log(`  ✓ Item ${item.title} already has packageInfo`);
          updatedItems.push(item);
          continue;
        }

        // Fetch product data
        const productDoc = await productsRef.doc(item.id).get();
        if (!productDoc.exists) {
          console.log(`  ⚠️  Product ${item.id} not found, skipping`);
          updatedItems.push(item);
          continue;
        }

        const productData = productDoc.data();
        const packageInfo = productData.packageInfo || null;
        const category = productData.category || item.category || null;

        // Calculate correct subtotal
        let subtotal = item.subtotal;
        if (packageInfo && packageInfo.itemsPerBox) {
          const actualQuantity = item.quantity * packageInfo.itemsPerBox;
          subtotal = item.price * actualQuantity;
          console.log(`  📦 ${item.title}: ${item.quantity} koli × ${packageInfo.itemsPerBox} adet/koli = ${actualQuantity} adet`);
          console.log(`     Price: ${item.price} × ${actualQuantity} = ${subtotal} TL`);
          needsUpdate = true;
        }

        updatedItems.push({
          ...item,
          packageInfo,
          category,
          subtotal
        });
      }

      // Update order if needed
      if (needsUpdate) {
        // Recalculate order subtotal
        const newSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
        const shippingTotal = orderData.totals?.shippingTotal || 0;
        const discountTotal = orderData.totals?.discountTotal || 0;
        const newTotal = newSubtotal + shippingTotal - discountTotal;

        await ordersRef.doc(orderId).update({
          items: updatedItems,
          "totals.subtotal": newSubtotal,
          "totals.total": newTotal,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`  ✅ Updated order ${orderId}`);
        console.log(`     Old subtotal: ${orderData.totals?.subtotal || 0} TL → New subtotal: ${newSubtotal} TL`);
        updatedCount++;
      } else {
        console.log(`  ⏭️  Order ${orderId} already correct, skipping`);
        skippedCount++;
      }

    } catch (error) {
      console.error(`  ❌ Error processing order ${orderId}:`, error.message);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Migration complete!");
  console.log(`✅ Updated: ${updatedCount} orders`);
  console.log(`⏭️  Skipped: ${skippedCount} orders`);
  console.log(`❌ Errors: ${errorCount} orders`);
  console.log("=".repeat(60));
}

// Run the migration
fixOrders()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
