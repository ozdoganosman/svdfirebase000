"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Toast } from "@/components/toast";

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

const getEffectivePrice = (item: CartItem): number => {
  // Use priceTRY if available, fallback to price
  const basePrice = item.priceTRY ?? item.price ?? 0;

  if (!item.bulkPricing || item.bulkPricing.length === 0) {
    return basePrice;
  }

  // For products with packageInfo, bulk pricing is based on box count
  const comparisonQty = item.packageInfo ? item.quantity : item.quantity;

  const sortedTiers = [...item.bulkPricing].sort((a, b) => b.minQty - a.minQty);

  for (const tier of sortedTiers) {
    if (comparisonQty >= tier.minQty) {
      return tier.price;
    }
  }

  return basePrice;
};

const getAppliedTier = (item: CartItem): BulkTier | null => {
  if (!item.bulkPricing || item.bulkPricing.length === 0) {
    return null;
  }
  
  const comparisonQty = item.packageInfo ? item.quantity : item.quantity;
  const sortedTiers = [...item.bulkPricing].sort((a, b) => b.minQty - a.minQty);
  
  for (const tier of sortedTiers) {
    if (comparisonQty >= tier.minQty) {
      return tier;
    }
  }
  
  return null;
};

const getNextTier = (item: CartItem): BulkTier | null => {
  if (!item.bulkPricing || item.bulkPricing.length === 0) {
    return null;
  }
  
  const comparisonQty = item.packageInfo ? item.quantity : item.quantity;
  const sortedTiers = [...item.bulkPricing].sort((a, b) => a.minQty - b.minQty);
  
  for (const tier of sortedTiers) {
    if (comparisonQty < tier.minQty) {
      return tier;
    }
  }
  
  return null;
};

const calculateItemTotal = (item: CartItem): number => {
  const effectivePrice = getEffectivePrice(item);
  const totalItems = getTotalItemCount(item);
  return effectivePrice * totalItems;
};

const calculateSubtotal = (items: CartItem[]) =>
  items.reduce((total, item) => total + calculateItemTotal(item), 0);

type CartProviderProps = {
  children: React.ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
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

  const addItem = (product: ProductSummary, quantity = 1) => {
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
