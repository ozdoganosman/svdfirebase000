/**
 * API Cache Utility
 * Uses sessionStorage to cache API responses and reduce redundant calls
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

// Default cache duration: 5 minutes
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

// Long cache duration for rarely changing data: 30 minutes
export const LONG_CACHE_DURATION = 30 * 60 * 1000;

// Short cache duration for frequently changing data: 1 minute
export const SHORT_CACHE_DURATION = 1 * 60 * 1000;

const isBrowser = typeof window !== "undefined";

function getCacheKey(key: string): string {
  return `svd-api-cache:${key}`;
}

export function getFromCache<T>(key: string): T | null {
  if (!isBrowser) return null;

  try {
    const cacheKey = getCacheKey(key);
    const stored = sessionStorage.getItem(cacheKey);

    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn("Cache read error:", error);
    return null;
  }
}

export function setInCache<T>(key: string, data: T, duration = DEFAULT_CACHE_DURATION): void {
  if (!isBrowser) return;

  try {
    const cacheKey = getCacheKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.warn("Cache write error:", error);
  }
}

export function invalidateCache(key: string): void {
  if (!isBrowser) return;

  try {
    const cacheKey = getCacheKey(key);
    sessionStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn("Cache invalidation error:", error);
  }
}

export function invalidateCacheByPrefix(prefix: string): void {
  if (!isBrowser) return;

  try {
    const fullPrefix = getCacheKey(prefix);
    const keysToRemove: string[] = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn("Cache prefix invalidation error:", error);
  }
}

export function clearAllCache(): void {
  if (!isBrowser) return;

  try {
    const keysToRemove: string[] = [];
    const prefix = "svd-api-cache:";

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.warn("Cache clear error:", error);
  }
}

/**
 * Cached fetch wrapper
 * Automatically caches successful responses
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    duration?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const { duration = DEFAULT_CACHE_DURATION, forceRefresh = false } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getFromCache<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  setInCache(key, data, duration);

  return data;
}

// Cache keys for common API calls
export const CACHE_KEYS = {
  PRICING_SETTINGS: "pricing-settings",
  COMBO_SETTINGS: "combo-settings",
  PUBLIC_SITE_SETTINGS: "public-site-settings",
  EXCHANGE_RATE: "exchange-rate",
  CATEGORIES: "categories",
  PRODUCTS: "products",
  USER_ROLE: "user-role",
  ALL_SETTINGS: "all-settings",
};
