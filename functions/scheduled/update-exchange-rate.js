/**
 * Scheduled Function - Update Exchange Rate Daily
 * Runs every day at 16:00 Istanbul time (after TCMB updates)
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { fetchTCMBRate } from "../services/exchange-rate.js";
import { saveExchangeRate, needsUpdate, getCurrentRate } from "../db/exchange-rates.js";

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

      // Try to fetch latest rate from TCMB
      let rateData;
      try {
        rateData = await fetchTCMBRate();
        console.log("[Scheduled Job] Fetched new rate from TCMB:", rateData.rate);
      } catch (fetchError) {
        console.warn("[Scheduled Job] Could not fetch from TCMB:", fetchError.message);
        console.log("[Scheduled Job] Will continue using last saved rate");
        
        // Get the last saved rate
        const lastRate = await getCurrentRate("USD");
        if (lastRate) {
          console.log("[Scheduled Job] Using last saved rate:", lastRate.rate);
          return {
            success: true,
            message: "TCMB unavailable, using last saved rate",
            data: lastRate,
          };
        } else {
          throw new Error("No rate available - first run failed");
        }
      }

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

/**
 * Keep-warm function to prevent cold starts on main site
 * Runs every 5 minutes to keep the SSR function warm
 */
export const keepSiteWarm = onSchedule(
  {
    schedule: "*/5 * * * *", // Every 5 minutes
    timeZone: "Europe/Istanbul",
    memory: "128MiB",
  },
  async () => {
    console.log("[Keep Warm] Pinging site to prevent cold start...");

    try {
      // Ping the main site to keep SSR function warm
      const response = await fetch("https://spreyvalfdunyasi.com/", {
        method: "GET",
        headers: {
          "User-Agent": "Firebase-KeepWarm/1.0",
        },
      });

      console.log("[Keep Warm] Site pinged successfully:", {
        status: response.status,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        status: response.status,
      };
    } catch (error) {
      console.error("[Keep Warm] Error pinging site:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
);
