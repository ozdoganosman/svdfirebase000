/**
 * Update all products to inherit productType from their category
 * Run this once to update existing products after adding productType to categories
 */

import { db } from "../db/client.js";

const categoriesCollection = db.collection("categories");
const productsCollection = db.collection("products");

async function updateProductsFromCategories() {
  console.log("Starting to update products from their categories...\n");

  // Get all categories
  const categoriesSnapshot = await categoriesCollection.get();
  const categories = {};

  categoriesSnapshot.forEach((doc) => {
    const data = doc.data();
    categories[doc.id] = {
      id: doc.id,
      name: data.name,
      productType: data.productType || null,
    };
  });

  console.log(`Found ${Object.keys(categories).length} categories:\n`);
  Object.values(categories).forEach(cat => {
    console.log(`  - ${cat.name} (${cat.id}): ${cat.productType || "no type"}`);
  });
  console.log("");

  // Get all products
  const productsSnapshot = await productsCollection.get();
  console.log(`Found ${productsSnapshot.size} products to process\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of productsSnapshot.docs) {
    const data = doc.data();
    const productId = doc.id;
    const categoryId = data.category;
    const currentProductType = data.productType;

    if (!categoryId) {
      console.log(`  ⚠️  ${data.title}: No category assigned`);
      skipped++;
      continue;
    }

    const category = categories[categoryId];
    if (!category) {
      console.log(`  ⚠️  ${data.title}: Category ${categoryId} not found`);
      skipped++;
      continue;
    }

    const newProductType = category.productType;

    if (currentProductType === newProductType) {
      console.log(`  ✓ ${data.title}: Already has correct productType (${newProductType || "null"})`);
      skipped++;
      continue;
    }

    try {
      await productsCollection.doc(productId).update({
        productType: newProductType,
        updatedAt: new Date(),
      });

      console.log(`  ✅ ${data.title}: Updated from '${currentProductType || "null"}' to '${newProductType || "null"}' (category: ${category.name})`);
      updated++;
    } catch (error) {
      console.error(`  ❌ ${data.title}: Error updating - ${error.message}`);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Update Summary:");
  console.log(`  Total products: ${productsSnapshot.size}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log("=".repeat(60));
}

updateProductsFromCategories()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
