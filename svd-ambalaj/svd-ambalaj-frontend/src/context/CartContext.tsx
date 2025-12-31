"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Toast } from "@/components/toast";
import { getCurrentRate, convertUSDToTRY } from "@/lib/currency";
import { cachedFetch, CACHE_KEYS, LONG_CACHE_DURATION } from "@/lib/api-cache";

type ComboSettings = {
  isActive: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number;
  applicableTypes: string[];
  requireSameNeckSize: boolean;
  minQuantity: number;
};

type BulkTier = {
  minQty: number;
  price: number;
};

type VariantOption = {
  id: string;
  name: string;
  stock: number;
  priceModifier: number;
};

type VariantSegment = {
  id: string;
  name: string;
  required: boolean;
  options: VariantOption[];
};

export type SelectedVariants = Record<string, string>; // segmentId -> optionId

type ProductSummary = {
  id: string;
  title: string;
  slug: string;
  price?: number;
  priceUSD?: number;
  priceTRY?: number;
  bulkPricing?: BulkTier[];
  bulkPricingUSD?: BulkTier[];
  // Combo discount fields
  productType?: string | null; // "başlık" | "şişe" | "nötr"
  neckSize?: string | null; // "24/410" | "28/410"
  packageInfo?: {
    itemsPerBox: number;
    minBoxes: number;
    boxLabel: string;
  };
  stock?: number;
  images?: string[];
  specifications?: {
    hoseLength?: string;
    volume?: string;
    color?: string;
    neckSize?: string;
  };
  // Variant fields
  variants?: VariantSegment[];
  hasVariants?: boolean;
};

type CartItem = ProductSummary & {
  quantity: number;
  selectedVariants?: SelectedVariants; // Selected variant options
  variantSummary?: string; // Human-readable summary of selected variants
};

type ComboMatch = {
  type1: string;
  type2: string;
  neckSize: string | null;
  matchedQuantity: number;
  item1Ids: string[];
  item2Ids: string[];
  itemComboQuantities?: Record<string, number>; // Item ID -> combo quantity
};

export type CartContextValue = {
  items: CartItem[];
  addItem: (product: ProductSummary, quantity?: number, selectedVariants?: SelectedVariants) => void;
  removeItem: (cartItemId: string) => void; // Now uses cart item ID
  updateQuantity: (cartItemId: string, quantity: number) => void; // Now uses cart item ID
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  getCartItemId: (productId: string, selectedVariants?: SelectedVariants) => string;
  subtotal: number;
  totalBoxes: number;
  totalItems: number;
  comboDiscount: number; // Total combo discount in TRY
  comboMatches: ComboMatch[]; // Combo matches found
  comboDiscountLabel: string; // Label for combo discount (e.g., "%10" or "$0.02")
  taxRate: number; // Dynamic tax rate from settings (e.g., 20 for 20%)
  exchangeRate: number; // Current exchange rate
  getBoxCount: (item: CartItem) => number;
  getTotalItemCount: (item: CartItem) => number;
  getEffectivePrice: (item: CartItem) => number;
  getAppliedTier: (item: CartItem) => BulkTier | null;
  getNextTier: (item: CartItem) => BulkTier | null;
  calculateItemTotal: (item: CartItem) => number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "svd-ambalaj-cart";

const getBoxCount = (item: CartItem): number => {
  // If packageInfo exists, quantity represents boxes, otherwise individual items
  return item.quantity;
};

const getTotalItemCount = (item: CartItem): number => {
  if (item.packageInfo) {
    return item.quantity * item.packageInfo.itemsPerBox;
  }
  return item.quantity;
};

// Moved inside CartProvider to access exchangeRate
// const getEffectivePrice will be defined inside CartProvider

const getAppliedTier = (item: CartItem): BulkTier | null => {
  // Use bulkPricingUSD for USD-based products, fallback to bulkPricing
  const bulkPricing = item.bulkPricingUSD || item.bulkPricing;

  if (!bulkPricing || bulkPricing.length === 0) {
    return null;
  }

  const comparisonQty = item.packageInfo ? item.quantity : item.quantity;
  const sortedTiers = [...bulkPricing].sort((a, b) => b.minQty - a.minQty);

  for (const tier of sortedTiers) {
    if (comparisonQty >= tier.minQty) {
      return tier;
    }
  }

  return null;
};

const getNextTier = (item: CartItem): BulkTier | null => {
  // Use bulkPricingUSD for USD-based products, fallback to bulkPricing
  const bulkPricing = item.bulkPricingUSD || item.bulkPricing;

  if (!bulkPricing || bulkPricing.length === 0) {
    return null;
  }

  const comparisonQty = item.packageInfo ? item.quantity : item.quantity;
  const sortedTiers = [...bulkPricing].sort((a, b) => a.minQty - b.minQty);

  for (const tier of sortedTiers) {
    if (comparisonQty < tier.minQty) {
      return tier;
    }
  }

  return null;
};

// Moved inside CartProvider to access getEffectivePrice
// calculateItemTotal and calculateSubtotal will be defined inside CartProvider

type CartProviderProps = {
  children: React.ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(34.0); // Fallback rate
  const [taxRate, setTaxRate] = useState<number>(20); // Default 20% VAT
  const [comboSettings, setComboSettings] = useState<ComboSettings | null>(null);

  // Fetch exchange rate on mount
  useEffect(() => {
    getCurrentRate()
      .then((rate) => setExchangeRate(rate.rate))
      .catch((error) => {
        console.error("Failed to fetch exchange rate:", error);
        // Keep fallback rate
      });
  }, []);

  // Fetch pricing settings (taxRate) on mount - with cache
  useEffect(() => {
    const fetchPricingSettings = async () => {
      try {
        const data = await cachedFetch(
          CACHE_KEYS.PRICING_SETTINGS,
          async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-tfi7rlxtca-uc.a.run.app'}/pricing-settings`);
            if (!response.ok) {
              throw new Error("Failed to fetch pricing settings");
            }
            return response.json();
          },
          { duration: LONG_CACHE_DURATION }
        );
        if (data.settings?.taxRate !== undefined) {
          setTaxRate(data.settings.taxRate);
        }
      } catch (error) {
        console.error("Failed to fetch pricing settings");
      }
    };

    fetchPricingSettings();
  }, []);

  // Fetch combo settings on mount - with cache
  useEffect(() => {
    const fetchComboSettings = async () => {
      try {
        const data = await cachedFetch(
          CACHE_KEYS.COMBO_SETTINGS,
          async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-tfi7rlxtca-uc.a.run.app'}/combo-settings`);
            if (!response.ok) {
              throw new Error("Failed to fetch combo settings");
            }
            return response.json();
          },
          { duration: LONG_CACHE_DURATION }
        );
        setComboSettings(data.settings);
      } catch (error) {
        console.error("Failed to fetch combo settings");
      }
    };

    fetchComboSettings();
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        // Migrate old cart items: if productType/neckSize missing, get from specifications
        const migratedItems = parsed.map(item => ({
          ...item,
          neckSize: item.neckSize || item.specifications?.neckSize || null,
          // Note: productType cannot be inferred, will need to be fetched from API
        }));

        // Fetch fresh product data for all items to get productType
        const fetchFreshData = async () => {
          const updatedItems = await Promise.all(
            migratedItems.map(async (item) => {
              // If productType already exists, skip
              if (item.productType) return item;

              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-tfi7rlxtca-uc.a.run.app'}/products/${item.id}`);
                if (!response.ok) return item;
                const data = await response.json();
                const freshProduct = data.product;

                // Update item with fresh productType and neckSize
                return {
                  ...item,
                  productType: freshProduct.productType || item.productType,
                  neckSize: freshProduct.neckSize || item.neckSize || item.specifications?.neckSize,
                };
              } catch (error) {
                console.error(`Failed to fetch fresh data for ${item.id}:`, error);
                return item;
              }
            })
          );

          setItems(updatedItems);
        };

        // Check if any item is missing productType
        const needsFreshData = migratedItems.some(item => !item.productType);

        if (needsFreshData) {
          // Wait for fresh data before setting items
          fetchFreshData();
        } else {
          // All items have productType, use them immediately
          setItems(migratedItems);
        }
      }
    } catch (error) {
      console.error("Failed to parse stored cart", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to persist cart", error);
    }
  }, [items]);

  // Get effective price with USD → TRY conversion
  const getEffectivePrice = (item: CartItem): number => {
    // Use priceTRY if available, fallback to price, fallback to USD converted to TRY
    let basePrice = item.priceTRY ?? item.price;

    // If no TRY price, convert USD to TRY
    if (basePrice === undefined && item.priceUSD) {
      basePrice = convertUSDToTRY(item.priceUSD, exchangeRate);
    }

    // If still no price, return 0
    if (basePrice === undefined) {
      basePrice = 0;
    }

    // Use bulkPricingUSD for USD-based products, fallback to bulkPricing
    const bulkPricingUSD = item.bulkPricingUSD;
    const bulkPricingTRY = item.bulkPricing;
    const hasBulkPricing = bulkPricingUSD || bulkPricingTRY;

    if (!hasBulkPricing || (bulkPricingUSD?.length === 0 && bulkPricingTRY?.length === 0)) {
      return basePrice;
    }

    // For products with packageInfo, bulk pricing is based on box count
    const comparisonQty = item.packageInfo ? item.quantity : item.quantity;

    // Check USD pricing first
    if (bulkPricingUSD && bulkPricingUSD.length > 0) {
      const sortedTiers = [...bulkPricingUSD].sort((a, b) => b.minQty - a.minQty);
      for (const tier of sortedTiers) {
        if (comparisonQty >= tier.minQty) {
          // Tier price is in USD, convert to TRY
          return tier.price * exchangeRate;
        }
      }
    }

    // Fallback to TRY pricing
    if (bulkPricingTRY && bulkPricingTRY.length > 0) {
      const sortedTiers = [...bulkPricingTRY].sort((a, b) => b.minQty - a.minQty);
      for (const tier of sortedTiers) {
        if (comparisonQty >= tier.minQty) {
          // Tier price is already in TRY, return as-is
          return tier.price;
        }
      }
    }

    return basePrice;
  };

  const calculateItemTotal = (item: CartItem): number => {
    const effectivePrice = getEffectivePrice(item);
    const totalItems = getTotalItemCount(item);
    return effectivePrice * totalItems;
  };

  const calculateSubtotal = (items: CartItem[]) =>
    items.reduce((total, item) => total + calculateItemTotal(item), 0);

  // Helper to generate variant summary for display
  const getVariantSummary = (product: ProductSummary, selectedVariants: SelectedVariants): string => {
    if (!product.variants || !selectedVariants) return '';

    const parts: string[] = [];
    for (const segment of product.variants) {
      const optionId = selectedVariants[segment.id];
      if (optionId) {
        const option = segment.options.find(o => o.id === optionId);
        if (option) {
          parts.push(`${segment.name}: ${option.name}`);
        }
      }
    }
    return parts.join(' | ');
  };

  // Generate unique cart item ID for variant products
  const getCartItemId = (productId: string, selectedVariants?: SelectedVariants): string => {
    if (!selectedVariants || Object.keys(selectedVariants).length === 0) {
      return productId;
    }
    // Sort keys to ensure consistent ID
    const sortedKeys = Object.keys(selectedVariants).sort();
    const variantPart = sortedKeys.map(k => `${k}:${selectedVariants[k]}`).join('_');
    return `${productId}__${variantPart}`;
  };

  const addItem = (product: ProductSummary, quantity = 1, selectedVariants?: SelectedVariants) => {
    setItems((prev) => {
      // For products with variants, use a unique cart item ID based on selected variants
      const cartItemId = getCartItemId(product.id, selectedVariants);
      const existing = prev.find((item) => getCartItemId(item.id, item.selectedVariants) === cartItemId);
      const newQuantity = existing ? existing.quantity + quantity : quantity;

      // For variant products, calculate stock from selected variants (minimum of selected options)
      let effectiveStock = product.stock;
      if (product.hasVariants && selectedVariants && product.variants) {
        const selectedStocks: number[] = [];
        for (const segment of product.variants) {
          const optionId = selectedVariants[segment.id];
          if (optionId) {
            const option = segment.options.find(o => o.id === optionId);
            if (option) {
              selectedStocks.push(option.stock);
            }
          }
        }
        if (selectedStocks.length > 0) {
          effectiveStock = Math.min(...selectedStocks);
        }
      }

      // Stock validation for packaged products
      if (effectiveStock !== undefined && product.packageInfo) {
        const availableBoxes = Math.floor(effectiveStock / product.packageInfo.itemsPerBox);
        if (newQuantity > availableBoxes) {
          setToastMessage(`⚠️ Stokta sadece ${availableBoxes} ${product.packageInfo.boxLabel.toLowerCase()} var!`);
          return prev;
        }
      }
      // Stock validation for regular products
      else if (effectiveStock !== undefined && newQuantity > effectiveStock) {
        setToastMessage(`⚠️ Stokta sadece ${effectiveStock} adet var!`);
        return prev;
      }

      // Generate variant summary for display
      const variantSummary = selectedVariants ? getVariantSummary(product, selectedVariants) : undefined;

      if (existing) {
        const displayText = variantSummary
          ? `${product.title} (${variantSummary}) sepete eklendi! (${newQuantity} ${product.packageInfo?.boxLabel.toLowerCase() || 'adet'})`
          : `${product.title} sepete eklendi! (${newQuantity} ${product.packageInfo?.boxLabel.toLowerCase() || 'adet'})`;
        setToastMessage(displayText);
        return prev.map((item) =>
          getCartItemId(item.id, item.selectedVariants) === cartItemId
            ? { ...product, quantity: newQuantity, selectedVariants, variantSummary } // Always use fresh product data
            : item
        );
      }
      const displayText = variantSummary
        ? `${product.title} (${variantSummary}) sepete eklendi!`
        : `${product.title} sepete eklendi!`;
      setToastMessage(displayText);
      return [...prev, { ...product, quantity, selectedVariants, variantSummary }];
    });
  };

  // removeItem now uses cart item ID (productId or productId__variants combination)
  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => getCartItemId(item.id, item.selectedVariants) !== cartItemId));
  };

  // updateQuantity now uses cart item ID
  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) => {
      const product = prev.find((item) => getCartItemId(item.id, item.selectedVariants) === cartItemId);
      if (!product) return prev;

      // For variant products, calculate stock from selected variants
      let effectiveStock = product.stock;
      if (product.hasVariants && product.selectedVariants && product.variants) {
        const selectedStocks: number[] = [];
        for (const segment of product.variants) {
          const optionId = product.selectedVariants[segment.id];
          if (optionId) {
            const option = segment.options.find(o => o.id === optionId);
            if (option) {
              selectedStocks.push(option.stock);
            }
          }
        }
        if (selectedStocks.length > 0) {
          effectiveStock = Math.min(...selectedStocks);
        }
      }

      // Stock validation for packaged products
      if (effectiveStock !== undefined && product.packageInfo) {
        const availableBoxes = Math.floor(effectiveStock / product.packageInfo.itemsPerBox);
        if (quantity > availableBoxes) {
          setToastMessage(`⚠️ Stokta sadece ${availableBoxes} ${product.packageInfo.boxLabel.toLowerCase()} var!`);
          return prev;
        }
      }
      // Stock validation for regular products
      else if (effectiveStock !== undefined && quantity > effectiveStock) {
        setToastMessage(`⚠️ Stokta sadece ${effectiveStock} adet var!`);
        return prev;
      }

      return prev.map((item) =>
        getCartItemId(item.id, item.selectedVariants) === cartItemId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => setItems([]);

  // Calculate combo discounts
  const calculateComboDiscounts = () => {
    const matches: ComboMatch[] = [];
    let totalDiscount = 0;
    let discountLabel = '';

    // If combo settings not loaded or not active, return empty
    if (!comboSettings || !comboSettings.isActive) {
      return { matches, totalDiscount, discountLabel };
    }

    const { discountType, discountValue, applicableTypes, requireSameNeckSize, minQuantity } = comboSettings;

    // Create discount label
    if (discountType === 'percentage') {
      discountLabel = `%${discountValue}`;
    } else if (discountType === 'fixed') {
      discountLabel = `$${discountValue.toFixed(2)}`;
    }

    // Group items by neckSize if required
    const itemsByNeckSize: Record<string, CartItem[]> = {};

    items.forEach((item) => {
      // Try to get neckSize from specifications if not in top level
      const neckSize = item.neckSize || item.specifications?.neckSize;

      // Skip items without productType or not in applicable types
      if (!item.productType || !applicableTypes.includes(item.productType)) {
        return;
      }

      // If neckSize is required but missing, skip
      if (requireSameNeckSize && !neckSize) {
        return;
      }

      // Group by neckSize if required, otherwise group all together
      const key = requireSameNeckSize && neckSize ? neckSize : 'all';
      if (!itemsByNeckSize[key]) {
        itemsByNeckSize[key] = [];
      }
      itemsByNeckSize[key].push({...item, neckSize: neckSize || null});
    });

    // Find combo matches (başlık + şişe with same neckSize)
    Object.keys(itemsByNeckSize).forEach((neckSizeKey) => {
      const itemsInGroup = itemsByNeckSize[neckSizeKey];

      // Separate by type
      const basliks = itemsInGroup.filter(i => i.productType === 'başlık');
      const sises = itemsInGroup.filter(i => i.productType === 'şişe');

      if (basliks.length === 0 || sises.length === 0) {
        return;
      }

      // Calculate total quantities
      const baslikQty = basliks.reduce((sum, item) => sum + getTotalItemCount(item), 0);
      const siseQty = sises.reduce((sum, item) => sum + getTotalItemCount(item), 0);

      // Matched quantity is the minimum
      const matchedQty = Math.min(baslikQty, siseQty);

      // Check minimum quantity requirement
      if (matchedQty < minQuantity) {
        return;
      }

      // Distribute combo quantity across items (PRIORITY: cheapest first)
      const itemComboQty: Record<string, number> = {};

      // Sort başlıks by price (cheapest first) - ucuz olanlara öncelik
      const sortedBasliks = [...basliks].sort((a, b) => {
        const priceA = getEffectivePrice(a);
        const priceB = getEffectivePrice(b);
        return priceA - priceB; // Ascending: ucuzdan pahalıya
      });

      // Sort şişes by price (cheapest first) - ucuz olanlara öncelik
      const sortedSises = [...sises].sort((a, b) => {
        const priceA = getEffectivePrice(a);
        const priceB = getEffectivePrice(b);
        return priceA - priceB; // Ascending: ucuzdan pahalıya
      });

      let remainingComboQty1 = matchedQty;
      sortedBasliks.forEach((item) => {
        const itemQty = getTotalItemCount(item);
        const itemCombo = Math.min(itemQty, remainingComboQty1);
        if (itemCombo > 0) {
          itemComboQty[item.id] = itemCombo;
          remainingComboQty1 -= itemCombo;
        }
      });

      let remainingComboQty2 = matchedQty;
      sortedSises.forEach((item) => {
        const itemQty = getTotalItemCount(item);
        const itemCombo = Math.min(itemQty, remainingComboQty2);
        if (itemCombo > 0) {
          itemComboQty[item.id] = itemCombo;
          remainingComboQty2 -= itemCombo;
        }
      });

      matches.push({
        type1: 'başlık',
        type2: 'şişe',
        neckSize: neckSizeKey === 'all' ? null : neckSizeKey,
        matchedQuantity: matchedQty,
        item1Ids: basliks.map(i => i.id),
        item2Ids: sises.map(i => i.id),
        itemComboQuantities: itemComboQty,
      });

      // Calculate discount for both types based on discount type
      [...basliks, ...sises].forEach((item) => {
        const discountQty = itemComboQty[item.id] || 0;
        if (discountQty === 0) return;

        const effectivePriceTRY = getEffectivePrice(item);

        // Convert TRY price back to USD for discount calculation
        const effectivePriceUSD = effectivePriceTRY / exchangeRate;

        let discountPerUnitUSD = 0;
        if (discountType === 'percentage') {
          discountPerUnitUSD = effectivePriceUSD * (discountValue / 100);
        } else if (discountType === 'fixed') {
          discountPerUnitUSD = discountValue;
        }

        const discountAmount = discountPerUnitUSD * discountQty * exchangeRate; // Convert to TRY
        totalDiscount += discountAmount;
      });
    });

    return { matches, totalDiscount, discountLabel };
  };

  const { matches: comboMatches, totalDiscount: comboDiscount, discountLabel: comboDiscountLabel } = calculateComboDiscounts();

  const subtotal = calculateSubtotal(items);
  const totalBoxes = items.reduce((total, item) => {
    return total + (item.packageInfo ? item.quantity : 0);
  }, 0);
  const totalItems = items.reduce((total, item) => {
    return total + getTotalItemCount(item);
  }, 0);
  const getItemQuantity = (productId: string) =>
    items.find((item) => item.id === productId)?.quantity ?? 0;

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    getCartItemId,
    subtotal,
    totalBoxes,
    totalItems,
    comboDiscount,
    comboMatches,
    comboDiscountLabel,
    taxRate,
    exchangeRate,
    getBoxCount,
    getTotalItemCount,
    getEffectivePrice,
    getAppliedTier,
    getNextTier,
    calculateItemTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
