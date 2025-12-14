/**
 * Script to fix HTML-encoded product data in Firestore
 * Decodes &#x2F; to / and &amp; to & etc.
 */

import admin from "firebase-admin";

// Initialize Firebase Admin using application default credentials
admin.initializeApp({
  projectId: "svdfirebase000",
});

const db = admin.firestore();

/**
 * Decode HTML entities in a string
 */
function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, "`")
    // Handle double-encoded entities
    .replace(/&amp;#x2F;/g, "/")
    .replace(/&amp;amp;/g, "&");
}

/**
 * Recursively decode HTML entities in an object
 */
function decodeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return decodeHtmlEntities(obj);
  if (Array.isArray(obj)) return obj.map(decodeObject);
  if (typeof obj === "object") {
    const decoded = {};
    for (const [key, value] of Object.entries(obj)) {
      decoded[key] = decodeObject(value);
    }
    return decoded;
  }
  return obj;
}

/**
 * Check if string contains encoded entities
 */
function hasEncodedEntities(str) {
  if (typeof str !== "string") return false;
  return /&#x2F;|&amp;|&lt;|&gt;|&quot;|&#x27;|&#x60;/.test(str);
}

/**
 * Check if object has any encoded entities
 */
function objectHasEncodedEntities(obj) {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === "string") return hasEncodedEntities(obj);
  if (Array.isArray(obj)) return obj.some(objectHasEncodedEntities);
  if (typeof obj === "object") {
    return Object.values(obj).some(objectHasEncodedEntities);
  }
  return false;
}

async function fixProducts() {
  console.log("Fetching products from Firestore...");
  const productsRef = db.collection("products");
  const snapshot = await productsRef.get();

  console.log(`Found ${snapshot.size} products`);

  let fixedCount = 0;
  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Check if this document has encoded entities
    if (objectHasEncodedEntities(data)) {
      console.log(`\nFound encoded entities in product: ${doc.id}`);
      console.log(`  Original title: ${data.title}`);

      const decoded = decodeObject(data);
      console.log(`  Decoded title: ${decoded.title}`);

      // Show other affected fields
      if (data.neckSize && hasEncodedEntities(data.neckSize)) {
        console.log(`  Original neckSize: ${data.neckSize}`);
        console.log(`  Decoded neckSize: ${decoded.neckSize}`);
      }
      if (data.images && data.images.some(hasEncodedEntities)) {
        console.log(`  Images had encoded URLs - decoded`);
      }
      if (data.image && hasEncodedEntities(data.image)) {
        console.log(`  Main image had encoded URL - decoded`);
      }

      batch.update(doc.ref, decoded);
      fixedCount++;
    }
  }

  if (fixedCount > 0) {
    console.log(`\nCommitting ${fixedCount} updates...`);
    await batch.commit();
    console.log(`Successfully fixed ${fixedCount} products!`);
  } else {
    console.log("\nNo products with encoded entities found.");
  }

  process.exit(0);
}

fixProducts().catch((error) => {
  console.error("Error fixing products:", error);
  process.exit(1);
});
