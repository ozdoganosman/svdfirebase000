import axios from "axios";

const API_URL = "https://api-tfi7rlxtca-uc.a.run.app";
const ADMIN_EMAIL = "admin@svd-ambalaj.local";
const ADMIN_PASSWORD = "1n7reLm0KQ%i7u3zNfBk54HYvZpQxSgW";
const CURRENT_RATE = 41.9721;

async function login() {
  console.log("Admin login...");
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return response.data.token;
}

async function getProducts(token) {
  const response = await axios.get(`${API_URL}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.products;
}

async function updateProduct(token, productId, data) {
  const response = await axios.put(
    `${API_URL}/products/${productId}`,
    data,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.product;
}

async function main() {
  console.log("=== Ürün Fiyatlarını USD'ye Çevirme ===\n");

  const token = await login();
  console.log("✓ Login başarılı\n");

  const products = await getProducts(token);
  console.log(`Toplam ${products.length} ürün bulundu.\n`);

  for (const product of products) {
    const title = product.title;
    const currentPrice = product.price || 0;
    const currentPriceUSD = product.priceUSD || 0;

    console.log(`\n📦 ${title}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Mevcut TL: ₺${currentPrice}`);
    console.log(`   Mevcut USD: $${currentPriceUSD}`);

    let newPriceUSD = currentPriceUSD;

    // TL fiyat varsa ama USD yoksa veya 0 ise, çevir
    if (currentPrice > 0 && currentPriceUSD === 0) {
      newPriceUSD = Number((currentPrice / CURRENT_RATE).toFixed(4));
      console.log(`   ➜ Hesaplanan USD: $${newPriceUSD} (${currentPrice} / ${CURRENT_RATE})`);
    } else if (currentPriceUSD > 0) {
      console.log(`   ✓ USD fiyat zaten mevcut: $${currentPriceUSD}`);
      continue; // Skip update
    } else {
      console.log(`   ⚠ Hem TL hem USD fiyat 0 - atlanıyor`);
      continue;
    }

    // Bulk pricing'i de düzelt
    const bulkPricing = product.bulkPricing || [];
    const bulkPricingUSD = [];

    if (bulkPricing.length > 0) {
      console.log(`   Katman fiyatları:`);
      for (const tier of bulkPricing) {
        const tierPriceUSD = Number((tier.price / CURRENT_RATE).toFixed(4));
        bulkPricingUSD.push({
          minQty: tier.minQty,
          price: tierPriceUSD,
        });
        console.log(`     ${tier.minQty}+ koli: ₺${tier.price} → $${tierPriceUSD}`);
      }
    }

    // Update via API
    const updateData = {
      priceUSD: newPriceUSD,
    };

    if (bulkPricingUSD.length > 0) {
      updateData.bulkPricingUSD = JSON.stringify(bulkPricingUSD);
    }

    await updateProduct(token, product.id, updateData);
    console.log(`   ✅ Güncellendi`);
  }

  console.log("\n\n✅ Tüm ürünler güncellendi!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Hata:", error.response?.data || error.message);
    process.exit(1);
  });
