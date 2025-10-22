/**
 * Exchange Rate Service
 * Fetches USD exchange rate from TCMB (Central Bank of Turkey)
 */

import axios from "axios";
import xml2js from "xml2js";

/**
 * Fetch current USD exchange rate from TCMB
 * @returns {Promise<{currency: string, rate: number, date: string, source: string}>}
 */
async function fetchTCMBRate() {
  try {
    const today = new Date();
    const dateStr = formatDateForTCMB(today);

    // Try today's rate first
    let url = `https://www.tcmb.gov.tr/kurlar/${dateStr.yearMonth}/${dateStr.full}.xml`;

    console.log("[Exchange Rate] Fetching from TCMB:", url);

    let response;
    try {
      response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    } catch {
      // If today's rate not available, try yesterday
      console.log("[Exchange Rate] Today's rate not available, trying yesterday...");
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateForTCMB(yesterday);
      url = `https://www.tcmb.gov.tr/kurlar/${yesterdayStr.yearMonth}/${yesterdayStr.full}.xml`;
      response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    }

    // Parse XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    // Find USD currency
    const currencies = result.Tarih_Date.Currency;
    const usdData = currencies.find((c) => c.$.CurrencyCode === "USD");

    if (!usdData) {
      throw new Error("USD rate not found in TCMB data");
    }

    // Get effective selling rate (ForexSelling)
    const rate = parseFloat(usdData.ForexSelling[0]);
    const date = result.Tarih_Date.$.Date;

    console.log("[Exchange Rate] Successfully fetched:", { rate, date });

    return {
      currency: "USD",
      rate: rate,
      date: date,
      source: "TCMB",
      effectiveDate: formatDateToISO(date),
    };
  } catch (error) {
    console.error("[Exchange Rate] TCMB fetch error:", error.message);

    // Fallback to alternative API
    try {
      console.log("[Exchange Rate] Trying fallback API...");
      return await fetchFallbackRate();
    } catch (fallbackError) {
      console.error("[Exchange Rate] Fallback API also failed:", fallbackError.message);
      throw new Error("Could not fetch exchange rate from any source");
    }
  }
}

/**
 * Fallback API - doviz.com free API
 */
async function fetchFallbackRate() {
  try {
    const response = await axios.get("https://api.genelpara.com/embed/doviz.json", {
      timeout: 5000,
    });

    const usdData = response.data.USD;

    if (!usdData || !usdData.satis) {
      throw new Error("USD rate not found in fallback API");
    }

    const rate = parseFloat(usdData.satis);
    const today = new Date().toISOString().split("T")[0];

    console.log("[Exchange Rate] Fallback API success:", { rate, date: today });

    return {
      currency: "USD",
      rate: rate,
      date: today,
      source: "doviz.com",
      effectiveDate: today,
    };
  } catch (error) {
    throw new Error("Fallback API failed: " + error.message);
  }
}

/**
 * Format date for TCMB URL
 * @param {Date} date
 * @returns {{full: string, yearMonth: string}}
 */
function formatDateForTCMB(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return {
    full: `${day}${month}${year}`,
    yearMonth: `${year}${month}`,
  };
}

/**
 * Convert TCMB date format (DD.MM.YYYY) to ISO (YYYY-MM-DD)
 */
function formatDateToISO(tcmbDate) {
  try {
    const [day, month, year] = tcmbDate.split(".");
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export {
  fetchTCMBRate,
  fetchFallbackRate,
};

