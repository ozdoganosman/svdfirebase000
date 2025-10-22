import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp({
  projectId: "svdfirebase000",
});

const db = getFirestore();

async function fixProducts() {
  console.log("=== Ürün Fiyatlarını USD'ye Çevirme ===\n");

  const productsRef = db.collection("products");
  const snapshot = await productsRef.get();

  console.log(`Toplam ${snapshot.size} ürün bulundu.\n`);

  const currentRate = 41.9721; // Güncel TCMB kuru

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const productId = doc.id;
    const title = data.title;
    const currentPrice = data.price || 0;
    const currentPriceUSD = data.priceUSD || 0;

    console.log(`\n📦 ${title}`);
    console.log(`   ID: ${productId}`);
    console.log(`   Mevcut TL: ₺${currentPrice}`);
    console.log(`   Mevcut USD: $${currentPriceUSD}`);

    // Eğer TL fiyat varsa ama USD yoksa, TL'yi USD'ye çevir
    let newPriceUSD = currentPriceUSD;
    
    if (currentPrice > 0 && currentPriceUSD === 0) {
      // TL'yi USD'ye çevir
      newPriceUSD = Number((currentPrice / currentRate).toFixed(4));
      console.log(`   ➜ Hesaplanan USD: $${newPriceUSD} (${currentPrice} / ${currentRate})`);
    } else if (currentPriceUSD > 0) {
      console.log(`   ✓ USD fiyat zaten mevcut`);
    } else {
      console.log(`   ⚠ Hem TL hem USD fiyat 0`);
    }

    // Bulk pricing'i de düzelt
    const bulkPricing = data.bulkPricing || [];
    const bulkPricingUSD = [];

    if (bulkPricing.length > 0) {
      console.log(`   Katman fiyatları:`);
      for (const tier of bulkPricing) {
        const tierPriceUSD = Number((tier.price / currentRate).toFixed(4));
        bulkPricingUSD.push({
          minQty: tier.minQty,
          price: tierPriceUSD,
        });
        console.log(`     ${tier.minQty}+ koli: ₺${tier.price} → $${tierPriceUSD}`);
      }
    }

    // Update Firestore
    const updateData = {
      priceUSD: newPriceUSD,
      price: currentPrice, // Keep TL as is
    };

    if (bulkPricingUSD.length > 0) {
      updateData.bulkPricingUSD = bulkPricingUSD;
    }

    await productsRef.doc(productId).update(updateData);
    console.log(`   ✅ Güncellendi`);
  }

  console.log("\n\n✅ Tüm ürünler güncellendi!");
}

fixProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Hata:", error);
    process.exit(1);
  });
