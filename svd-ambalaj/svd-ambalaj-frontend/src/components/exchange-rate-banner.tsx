"use client";

import { useEffect, useState } from "react";
import { getCurrentRate, getRateDisplayText, type ExchangeRate } from "@/lib/currency";

export default function ExchangeRateBanner() {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setLoading(true);
        const currentRate = await getCurrentRate();
        setRate(currentRate);
        setError(false);
      } catch (err) {
        console.error("[ExchangeRateBanner] Failed to fetch rate:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();

    // Refresh rate every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
        <p className="text-sm text-amber-800">
          💵 Kur bilgisi yükleniyor...
        </p>
      </div>
    );
  }

  if (error || !rate) {
    return null; // Don't show banner if rate fetch failed
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 px-4 py-2 text-center shadow-sm">
      <p className="text-sm font-medium text-amber-900">
        {getRateDisplayText(rate)}
      </p>
    </div>
  );
}
