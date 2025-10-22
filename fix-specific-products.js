import axios from "axios";

const API_URL = "https://api-tfi7rlxtca-uc.a.run.app";
const ADMIN_EMAIL = "admin@svd-ambalaj.local";
const ADMIN_PASSWORD = "1n7reLm0KQ%i7u3zNfBk54HYvZpQxSgW";
const CURRENT_RATE = 41.9721;

async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  return response.data.token;
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
  console.log("=== Manuel Fiyat Düzeltmeleri ===\n");

  const token = await login();
  console.log("✓ Login başarılı\n");

  // 24 Losyon Pompası - ₺5.00 → $0.119
  console.log("📦 24 Losyon Pompası düzeltiliyor...");
  await updateProduct(token, "XgEIIn9wtuESrFandUs3", {
    priceUSD: 0.119,
    bulkPricingUSD: JSON.stringify([
      { minQty: 50, price: 0.095 },  // ₺4.00
      { minQty: 100, price: 0.083 }, // ₺3.50
    ]),
  });
  console.log("✅ $0.119 olarak güncellendi\n");

  // 24 Kristal Krem Pompa - Set to $0.12
  console.log("📦 24 Kristal Krem Pompa düzeltiliyor...");
  await updateProduct(token, "XaWUKIHGbQyz8XgKVr5J", {
    priceUSD: 0.12,
    bulkPricingUSD: JSON.stringify([
      { minQty: 50, price: 0.10 },  // Örnek
      { minQty: 100, price: 0.09 }, // Örnek
    ]),
  });
  console.log("✅ $0.12 olarak güncellendi\n");

  // Kopya ürünü - Delete edilmeli ama şimdilik 0 yapalım
  console.log("📦 24 Kristal Krem Pompa (Kopya) sıfırlanıyor...");
  await updateProduct(token, "TGsRuRpJbdBhDFBTtAOW", {
    priceUSD: 0,
  });
  console.log("✅ $0 olarak güncellendi\n");

  console.log("✅ Tüm düzeltmeler tamamlandı!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Hata:", error.response?.data || error.message);
    process.exit(1);
  });
