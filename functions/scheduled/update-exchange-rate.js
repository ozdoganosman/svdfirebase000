/**
 * Scheduled Function - Update Exchange Rate Daily
 * Runs every day at 16:00 Istanbul time (after TCMB updates)
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { fetchTCMBRate } from "../services/exchange-rate.js";
import { saveExchangeRate, needsUpdate } from "../db/exchange-rates.js";

/**
 * Scheduled function to update exchange rate
 * Schedule: Every day at 16:00 Istanbul time
 */
export const updateExchangeRate = onSchedule(
  {
    schedule: "0 16 * * *",
    timeZone: "Europe/Istanbul",
    memory: "256MiB",
  },
  async () => {
    console.log("[Scheduled Job] Starting exchange rate update...");

    try {
      // Check if update is needed
      const needs = await needsUpdate("USD");

      if (!needs) {
        console.log("[Scheduled Job] Rate is recent, skipping update");
        return { success: true, message: "Rate is up to date" };
      }

      // Fetch latest rate from TCMB
      const rateData = await fetchTCMBRate();

      // Save to Firestore
      const result = await saveExchangeRate(rateData);

      console.log("[Scheduled Job] Exchange rate updated successfully:", {
        rate: rateData.rate,
        date: rateData.effectiveDate,
        source: rateData.source,
      });

      return {
        success: true,
        message: "Exchange rate updated",
        data: result.data,
      };
    } catch (error) {
      console.error("[Scheduled Job] Error updating exchange rate:", error.message);

      // Don't throw - we don't want to fail the entire cron job
      return {
        success: false,
        error: error.message,
      };
    }
  },
);

/**
 * Manual trigger function for immediate update
 * Can be called from admin panel
 */
export const forceUpdateExchangeRate = onSchedule(
  {
    schedule: "every 24 hours", // Default schedule, but primarily for manual invocation
    memory: "256MiB",
  },
  async () => {
    console.log("[Manual Update] Force updating exchange rate...");

    try {
      // Fetch latest rate from TCMB
      const rateData = await fetchTCMBRate();

      // Save to Firestore
      const result = await saveExchangeRate(rateData);

      console.log("[Manual Update] Exchange rate force updated:", {
        rate: rateData.rate,
        date: rateData.effectiveDate,
        source: rateData.source,
      });

      return {
        success: true,
        message: "Exchange rate manually updated",
        data: result.data,
      };
    } catch (error) {
      console.error("[Manual Update] Error:", error.message);
      throw error;
    }
  },
);
