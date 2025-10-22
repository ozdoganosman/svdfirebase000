import axios from "axios";

const API_URL = "https://api-tfi7rlxtca-uc.a.run.app";
const ADMIN_EMAIL = "admin@svd-ambalaj.local";
const ADMIN_PASSWORD = "1n7reLm0KQ%i7u3zNfBk54HYvZpQxSgW";

async function login() {
  console.log("Logging in as admin...");
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  
  console.log("✓ Login successful");
  return response.data.token;
}

async function updateExchangeRate(token) {
  console.log("Triggering exchange rate update...");
  const response = await axios.post(
    `${API_URL}/exchange-rate/update`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  console.log("✓ Exchange rate updated!");
  console.log("  Rate:", response.data.exchangeRate.rate);
  console.log("  Currency:", response.data.exchangeRate.currency);
  console.log("  Date:", response.data.exchangeRate.effectiveDate);
  console.log("  Source:", response.data.exchangeRate.source);
  
  return response.data;
}

async function main() {
  try {
    const token = await login();
    await updateExchangeRate(token);
    console.log("\n✓ Done! Exchange rate is now active in Firestore.");
  } catch (error) {
    console.error("✗ Error:", error.response?.data || error.message);
    process.exit(1);
  }
}

main();
