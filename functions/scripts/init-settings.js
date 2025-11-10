/**
 * Initialize default site settings
 * Usage: node init-settings.js
 *
 * This script creates default settings in Firestore for all settings sections.
 */

import { db } from "../db/client.js";
import { FieldValue } from "firebase-admin/firestore";

const siteSettingsCollection = db.collection("siteSettings");

const defaultSettings = {
  pricing: {
    currency: "TRY",
    taxRate: 20, // 20% KDV
    showPricesWithTax: true,
    allowGuestCheckout: false,
  },
  site: {
    siteName: "SVD Ambalaj",
    siteDescription: "Kaliteli ambalaj ürünleri",
    supportEmail: "info@svdambalaj.com",
    supportPhone: "+90 XXX XXX XX XX",
    maintenanceMode: false,
  },
  email: {
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: "",
    smtpPassword: "", // Should be encrypted
    fromEmail: "noreply@svdambalaj.com",
    fromName: "SVD Ambalaj",
  },
  payment: {
    paytrMerchantId: "",
    paytrMerchantKey: "", // Should be encrypted
    paytrMerchantSalt: "", // Should be encrypted
    paytrEnabled: false,
  },
  seo: {
    defaultTitle: "SVD Ambalaj - Kaliteli Ambalaj Ürünleri",
    defaultDescription: "Şişe, başlık ve daha fazlası için profesyonel ambalaj çözümleri",
    defaultKeywords: "ambalaj, şişe, başlık, pet şişe",
    googleAnalyticsId: "",
    facebookPixelId: "",
  },
};

async function initializeSettings() {
  console.log("🔧 Initializing default site settings...\n");

  const results = {
    created: [],
    existing: [],
    errors: [],
  };

  for (const [section, data] of Object.entries(defaultSettings)) {
    try {
      const docRef = siteSettingsCollection.doc(section);
      const existingDoc = await docRef.get();

      if (existingDoc.exists) {
        console.log(`  ⏭️  ${section}: Already exists, skipping`);
        results.existing.push(section);
        continue;
      }

      const settingsData = {
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: "system",
        updatedBy: "system",
      };

      await docRef.set(settingsData);
      console.log(`  ✅ ${section}: Created successfully`);
      results.created.push(section);
    } catch (error) {
      console.error(`  ❌ ${section}: Failed - ${error.message}`);
      results.errors.push({ section, error: error.message });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Initialization Summary:");
  console.log(`  Created: ${results.created.length} section(s)`);
  console.log(`  Existing: ${results.existing.length} section(s)`);
  console.log(`  Errors: ${results.errors.length}`);
  console.log("=".repeat(60));

  if (results.created.length > 0) {
    console.log("\n✅ Created sections:");
    results.created.forEach(section => console.log(`   - ${section}`));
  }

  if (results.existing.length > 0) {
    console.log("\n⏭️  Existing sections (skipped):");
    results.existing.forEach(section => console.log(`   - ${section}`));
  }

  if (results.errors.length > 0) {
    console.log("\n❌ Errors:");
    results.errors.forEach(({ section, error }) => {
      console.log(`   - ${section}: ${error}`);
    });
  }

  return results;
}

initializeSettings()
  .then((results) => {
    if (results.errors.length === 0) {
      console.log("\n🎉 All settings initialized successfully!");
      console.log("\nYou can now access the settings pages:");
      console.log("  - https://svdfirebase000.web.app/admin/settings/pricing");
      console.log("  - https://svdfirebase000.web.app/admin/settings/site");
      console.log("  - https://svdfirebase000.web.app/admin/settings/exchange-rates");
      process.exit(0);
    } else {
      console.log("\n⚠️  Some settings failed to initialize. Check errors above.");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
