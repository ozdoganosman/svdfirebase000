/**
 * VIP Pricing Utilities
 * Handles VIP discount calculations and price display
 */

export type VIPPricing = {
  originalPrice: number;
  vipPrice: number;
  discountAmount: number;
  discountPercent: number;
  hasDiscount: boolean;
};

/**
 * Calculate VIP price with discount
 */
export function calculateVIPPrice(
  basePrice: number,
  vipDiscount: number = 0,
  quantity: number = 1
): VIPPricing {
  const originalPrice = basePrice * quantity;
  const discountAmount = originalPrice * (vipDiscount / 100);
  const vipPrice = originalPrice - discountAmount;

  return {
    originalPrice,
    vipPrice,
    discountAmount,
    discountPercent: vipDiscount,
    hasDiscount: vipDiscount > 0,
  };
}

/**
 * Format price with VIP discount display
 */
export function formatVIPPrice(
  basePrice: number,
  vipDiscount: number = 0,
  options: {
    quantity?: number;
    currency?: string;
    showOriginal?: boolean;
  } = {}
): string {
  const { quantity = 1, currency = "TRY", showOriginal = true } = options;
  const pricing = calculateVIPPrice(basePrice, vipDiscount, quantity);

  const formatter = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
  });

  if (!pricing.hasDiscount) {
    return formatter.format(pricing.originalPrice);
  }

  if (showOriginal) {
    return `${formatter.format(pricing.vipPrice)} (${formatter.format(pricing.originalPrice)})`;
  }

  return formatter.format(pricing.vipPrice);
}

/**
 * Get VIP tier badge information
 */
export function getVIPTierBadge(tier: string | null): {
  label: string;
  icon: string;
  color: string;
} | null {
  if (!tier) return null;

  const badges = {
    platinum: {
      label: "Platinum",
      icon: "💎",
      color: "from-slate-300 to-slate-400",
    },
    gold: {
      label: "Gold",
      icon: "🥇",
      color: "from-amber-300 to-amber-500",
    },
    silver: {
      label: "Silver",
      icon: "🥈",
      color: "from-gray-200 to-gray-400",
    },
    bronze: {
      label: "Bronze",
      icon: "🥉",
      color: "from-orange-300 to-orange-500",
    },
  };

  return badges[tier as keyof typeof badges] || null;
}

/**
 * Calculate total cart value with VIP discount
 */
export function calculateCartTotal(
  items: Array<{ price: number; quantity: number }>,
  vipDiscount: number = 0
): {
  subtotal: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * (vipDiscount / 100);
  const total = subtotal - discount;

  return {
    subtotal,
    discount,
    total,
  };
}
