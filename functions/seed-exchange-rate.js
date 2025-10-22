import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import axios from "axios";
import { parseStringPromise } from "xml2js";

// Initialize Firebase Admin (uses Application Default Credentials)
initializeApp({
  projectId: "svdfirebase000",
});

const db = getFirestore();

async function fetchTCMBRate() {
  try {
    const url = "https://www.tcmb.gov.tr/kurlar/today.xml";
    console.log(`Fetching exchange rate from TCMB: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const result = await parseStringPromise(response.data);
    const currencies = result?.Tarih_Date?.Currency;

    if (!currencies || !Array.isArray(currencies)) {
      throw new Error("Invalid TCMB XML structure");
    }

    const usd = currencies.find((c) => c?.$.CurrencyCode === "USD");
    if (!usd || !usd.ForexSelling || !usd.ForexSelling[0]) {
      throw new Error("USD exchange rate not found in TCMB data");
    }

    const rate = parseFloat(usd.ForexSelling[0]);
    const effectiveDate = result?.Tarih_Date?.$?.Tarih || new Date().toISOString().split("T")[0];

    console.log(`✓ Fetched USD rate: ${rate} (Effective: ${effectiveDate})`);

    return {
      currency: "USD",
      rate,
      effectiveDate,
      source: "TCMB",
    };
  } catch (error) {
    console.error("✗ Failed to fetch TCMB rate:", error.message);
    throw error;
  }
}

async function saveExchangeRate(rateData) {
  try {
    const docRef = db.collection("exchange_rates").doc(rateData.currency);

    const now = FieldValue.serverTimestamp();
    const data = {
      ...rateData,
      lastUpdated: now,
      isActive: true,
    };

    await docRef.set(data, { merge: true });

    // Add to history subcollection
    await docRef.collection("history").add({
      ...rateData,
      timestamp: now,
    });

    console.log(`✓ Saved exchange rate to Firestore: ${rateData.currency} = ${rateData.rate}`);
    return data;
  } catch (error) {
    console.error("✗ Failed to save exchange rate:", error.message);
    throw error;
  }
}

async function seedExchangeRate() {
  console.log("=== Seeding Exchange Rate ===\n");

  try {
    const rateData = await fetchTCMBRate();
    await saveExchangeRate(rateData);

    console.log("\n✓ Exchange rate seeded successfully!");
    console.log(`  Currency: ${rateData.currency}`);
    console.log(`  Rate: ${rateData.rate}`);
    console.log(`  Effective Date: ${rateData.effectiveDate}`);
    console.log(`  Source: ${rateData.source}`);

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Seeding failed:", error);
    process.exit(1);
  }
}

seedExchangeRate();
