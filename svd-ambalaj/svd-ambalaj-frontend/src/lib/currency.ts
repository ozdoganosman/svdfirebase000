/**
 * Currency conversion and formatting utilities
 */

export interface ExchangeRate {
  currency: string;
  rate: number;
  effectiveDate: string;
  source: string;
  lastUpdated: Date | { toDate: () => Date } | string;
  isActive: boolean;
}

let cachedRate: ExchangeRate | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get current exchange rate from API (with caching)
 */
export async function getCurrentRate(): Promise<ExchangeRate> {
  // Return cached rate if available and fresh
  if (cachedRate && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedRate;
  }

  try {
    const response = await fetch("/api/exchange-rate");
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();
    cachedRate = data.exchangeRate;
    cacheTime = Date.now();

    return cachedRate!;
  } catch (error) {
    console.error("[Currency] Failed to fetch rate:", error);

    // Return cached rate if available (even if expired)
    if (cachedRate) {
      console.warn("[Currency] Using expired cached rate");
      return cachedRate;
    }

    // Fallback to a default rate
    console.warn("[Currency] Using fallback rate");
    return {
      currency: "USD",
      rate: 34.0,
      effectiveDate: new Date().toISOString().split("T")[0],
      source: "fallback",
      lastUpdated: new Date(),
      isActive: true,
    };
  }
}

/**
 * Convert USD to TRY
 */
export function convertUSDToTRY(usdAmount: number, rate: number): number {
  return usdAmount * rate;
}

/**
 * Convert TRY to USD
 */
export function convertTRYToUSD(tryAmount: number, rate: number): number {
  return tryAmount / rate;
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: "USD" | "TRY" = "TRY",
  options?: Intl.NumberFormatOptions
): string {
  const defaults: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  };

  const formatter = new Intl.NumberFormat("tr-TR", { ...defaults, ...options });
  return formatter.format(amount);
}

/**
 * Format price with dual currency display
 * If usdAmount is provided, convert to TRY and optionally show both
 * If tryAmount is provided, use it directly
 * Example: "₺5,00 ($0.15)" or just "₺5,00"
 */
export function formatDualPrice(
  usdAmount: number | undefined,
  rate: number,
  showUSD = true,
  multiplier = 1,
  tryAmount?: number
): string {
  // If TRY amount is provided directly, use it
  if (tryAmount !== undefined && tryAmount !== null) {
    return formatCurrency(tryAmount * multiplier, "TRY");
  }

  // If no USD amount, return zero formatted as TRY
  if (usdAmount === undefined || usdAmount === null) {
    return formatCurrency(0, "TRY");
  }

  const converted = convertUSDToTRY(usdAmount * multiplier, rate);
  const tryFormatted = formatCurrency(converted, "TRY");

  if (showUSD) {
    const usdFormatted = formatCurrency(usdAmount * multiplier, "USD");
    return `${tryFormatted} (${usdFormatted})`;
  }

  return tryFormatted;
}

/**
 * Format rate for display
 * Example: "₺34.5678"
 */
export function formatRate(rate: number): string {
  return `₺${rate.toFixed(4)}`;
}

/**
 * Get rate display text for header/banner
 */
export function getRateDisplayText(rate: ExchangeRate): string {
  const dateObj = new Date(rate.effectiveDate);
  const formattedDate = dateObj.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `💵 Güncel Dolar Kuru: ${formatRate(rate.rate)} (${rate.source} - ${formattedDate})`;
}

/**
 * Clear rate cache (useful after manual updates)
 */
export function clearRateCache(): void {
  cachedRate = null;
  cacheTime = 0;
}

/**
 * Pre-fetch and cache the rate (call on app init)
 */
export async function prefetchRate(): Promise<void> {
  try {
    await getCurrentRate();
  } catch (error) {
    console.error("[Currency] Pre-fetch failed:", error);
  }
}
