"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Toast } from "@/components/toast";
import { getCurrentRate, convertUSDToTRY } from "@/lib/currency";

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
};

type CartItem = ProductSummary & {
  quantity: number;
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
  addItem: (product: ProductSummary, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  subtotal: number;
  totalBoxes: number;
  totalItems: number;
  comboDiscount: number; // Total combo discount in TRY
  comboMatches: ComboMatch[]; // Combo matches found
  comboDiscountLabel: string; // Label for combo discount (e.g., "%10" or "$0.02")
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

  // Fetch combo settings on mount
  useEffect(() => {
    const fetchComboSettings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-tfi7rlxtca-uc.a.run.app'}/combo-settings`);
        if (!response.ok) {
          console.error("Failed to fetch combo settings");
          return;
        }
        const data = await response.json();
        setComboSettings(data.settings);
      } catch (error) {
        console.error("Error fetching combo settings:", error);
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

        setItems(migratedItems);
        fetchFreshData(); // Async update in background
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
    const bulkPricing = item.bulkPricingUSD || item.bulkPricing;

    if (!bulkPricing || bulkPricing.length === 0) {
      return basePrice;
    }

    // For products with packageInfo, bulk pricing is based on box count
    const comparisonQty = item.packageInfo ? item.quantity : item.quantity;

    const sortedTiers = [...bulkPricing].sort((a, b) => b.minQty - a.minQty);

    for (const tier of sortedTiers) {
      if (comparisonQty >= tier.minQty) {
        // Tier price is in USD, convert to TRY
        return tier.price * exchangeRate;
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

  const addItem = (product: ProductSummary, quantity = 1) => {
    console.log('➕ Adding to cart:', {
      title: product.title,
      productType: product.productType,
      neckSize: product.neckSize,
      hasSpecs: !!product.specifications,
      specsNeckSize: product.specifications?.neckSize,
    });

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const newQuantity = existing ? existing.quantity + quantity : quantity;
      
      // Stock validation for packaged products
      if (product.stock !== undefined && product.packageInfo) {
        const availableBoxes = Math.floor(product.stock / product.packageInfo.itemsPerBox);
        if (newQuantity > availableBoxes) {
          setToastMessage(`⚠️ Stokta sadece ${availableBoxes} ${product.packageInfo.boxLabel.toLowerCase()} var!`);
          return prev;
        }
      }
      // Stock validation for regular products
      else if (product.stock !== undefined && newQuantity > product.stock) {
        setToastMessage(`⚠️ Stokta sadece ${product.stock} adet var!`);
        return prev;
      }
      
      if (existing) {
        setToastMessage(`${product.title} sepete eklendi! (${newQuantity} ${product.packageInfo?.boxLabel.toLowerCase() || 'adet'})`);
        return prev.map((item) =>
          item.id === product.id
            ? { ...product, quantity: newQuantity } // Always use fresh product data
            : item
        );
      }
      setToastMessage(`${product.title} sepete eklendi!`);
      return [...prev, { ...product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) => {
      const product = prev.find((item) => item.id === productId);
      if (!product) return prev;
      
      // Stock validation for packaged products
      if (product.stock !== undefined && product.packageInfo) {
        const availableBoxes = Math.floor(product.stock / product.packageInfo.itemsPerBox);
        if (quantity > availableBoxes) {
          setToastMessage(`⚠️ Stokta sadece ${availableBoxes} ${product.packageInfo.boxLabel.toLowerCase()} var!`);
          return prev;
        }
      }
      // Stock validation for regular products
      else if (product.stock !== undefined && quantity > product.stock) {
        setToastMessage(`⚠️ Stokta sadece ${product.stock} adet var!`);
        return prev;
      }
      
      return prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
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

    // Debug: Log all items with their productType and neckSize
    console.log('🔍 Combo Debug - All cart items:', items.map(item => ({
      title: item.title,
      productType: item.productType,
      neckSize: item.neckSize,
      specifications: item.specifications,
    })));

    // Group items by neckSize if required
    const itemsByNeckSize: Record<string, CartItem[]> = {};

    items.forEach((item) => {
      // Try to get neckSize from specifications if not in top level
      const neckSize = item.neckSize || item.specifications?.neckSize;

      // Skip items without productType or not in applicable types
      if (!item.productType || !applicableTypes.includes(item.productType)) {
        console.log(`⚠️ Skipping item "${item.title}" - productType: ${item.productType} not in applicable types`);
        return;
      }

      // If neckSize is required but missing, skip
      if (requireSameNeckSize && !neckSize) {
        console.log(`⚠️ Skipping item "${item.title}" - neckSize required but missing`);
        return;
      }

      // Group by neckSize if required, otherwise group all together
      const key = requireSameNeckSize && neckSize ? neckSize : 'all';
      if (!itemsByNeckSize[key]) {
        itemsByNeckSize[key] = [];
      }
      itemsByNeckSize[key].push({...item, neckSize: neckSize || null});
    });

    console.log('📦 Grouped items by neckSize:', itemsByNeckSize);

    // Find combo matches (başlık + şişe with same neckSize)
    Object.keys(itemsByNeckSize).forEach((neckSizeKey) => {
      const itemsInGroup = itemsByNeckSize[neckSizeKey];

      // Separate by type
      const basliks = itemsInGroup.filter(i => i.productType === 'başlık');
      const sises = itemsInGroup.filter(i => i.productType === 'şişe');

      if (basliks.length === 0 || sises.length === 0) {
        console.log(`⚠️ No combo for ${neckSizeKey} - başlık: ${basliks.length}, şişe: ${sises.length}`);
        return;
      }

      // Calculate total quantities
      const baslikQty = basliks.reduce((sum, item) => sum + getTotalItemCount(item), 0);
      const siseQty = sises.reduce((sum, item) => sum + getTotalItemCount(item), 0);

      // Matched quantity is the minimum
      const matchedQty = Math.min(baslikQty, siseQty);

      // Check minimum quantity requirement
      if (matchedQty < minQuantity) {
        console.log(`⚠️ Combo quantity ${matchedQty} is below minimum ${minQuantity}`);
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

      console.log(`🔄 Combo for ${neckSizeKey}:`, {
        başlıkSorted: sortedBasliks.map(i => ({ title: i.title, price: getEffectivePrice(i), qty: getTotalItemCount(i) })),
        şişeSorted: sortedSises.map(i => ({ title: i.title, price: getEffectivePrice(i), qty: getTotalItemCount(i) })),
        matchedQty
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

    console.log('💰 Combo Discount Calculation:', {
      settings: comboSettings,
      matches: matches.length,
      totalDiscount,
      discountLabel,
      matchDetails: matches.map(m => ({
        type: `${m.type1}+${m.type2}`,
        neckSize: m.neckSize,
        quantity: m.matchedQuantity,
        itemBreakdown: m.itemComboQuantities ? Object.entries(m.itemComboQuantities).map(([id, qty]) => {
          const item = items.find(i => i.id === id);
          return {
            id,
            title: item?.title,
            comboQty: qty,
            totalQty: item ? getTotalItemCount(item) : 0,
            price: item ? getEffectivePrice(item) : 0
          };
        }) : []
      }))
    });

    return { matches, totalDiscount, discountLabel };
  };

  const { matches: comboMatches, totalDiscount: comboDiscount, discountLabel: comboDiscountLabel } = calculateComboDiscounts();

  console.log('🛒 Cart Context Values:', {
    comboMatches: comboMatches.length,
    comboDiscount,
    itemCount: items.length,
  });

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
    subtotal,
    totalBoxes,
    totalItems,
    comboDiscount,
    comboMatches,
    comboDiscountLabel,
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
