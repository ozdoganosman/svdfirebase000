"use client";

import { useState, useTransition } from "react";
import { useCart } from "@/context/CartContext";
import { trackAddToCart } from "./google-analytics";

export type AddToCartButtonProps = {
  product: {
    id: string;
    title: string;
    slug: string;
    price?: number;
    priceUSD?: number;
    priceTRY?: number;
    stock?: number;
    images?: string[];
    bulkPricing?: { minQty: number; price: number }[];
    bulkPricingUSD?: { minQty: number; price: number }[];
    packageInfo?: {
      itemsPerBox: number;
      minBoxes: number;
      boxLabel: string;
    };
    specifications?: {
      hoseLength?: string;
      volume?: string;
      color?: string;
      neckSize?: string;
    };
  };
  quantity?: number;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  showQuantitySelector?: boolean;
};

const variantClasses: Record<NonNullable<AddToCartButtonProps["variant"]>, string> = {
  primary:
    "inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-amber-500 px-5 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed",
};

export function AddToCartButton({
  product,
  quantity,
  variant = "primary",
  className = "",
  showQuantitySelector = true,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isPending, startTransition] = useTransition();

  // Use state for quantity when selector is enabled, otherwise use prop or default
  const minQty = product.packageInfo?.minBoxes || 1;
  const [selectedQuantity, setSelectedQuantity] = useState(quantity ?? minQty);

  // If packageInfo exists and quantity is not explicitly set, use minBoxes
  const effectiveQuantity = showQuantitySelector ? selectedQuantity : (quantity ?? minQty);

  const handleAddToCart = () => {
    startTransition(() => {
      addItem(product, effectiveQuantity);
      // Track add to cart event
      const unitPrice = product.price || product.priceTRY || 0;
      trackAddToCart(product.id, product.title, unitPrice, effectiveQuantity);
    });
  };

  const handleIncrement = () => {
    setSelectedQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    setSelectedQuantity(prev => Math.max(minQty, prev - 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= minQty) {
      setSelectedQuantity(value);
    }
  };

  const buttonText = product.packageInfo
    ? `Sepete Ekle`
    : "Sepete Ekle";

  // If quantity selector is disabled, show simple button
  if (!showQuantitySelector) {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isPending}
        className={`${variantClasses[variant]} ${className}`.trim()}
      >
        {isPending ? "Ekleniyor..." : (product.packageInfo ? `${effectiveQuantity} ${product.packageInfo.boxLabel} Sepete Ekle` : buttonText)}
      </button>
    );
  }

  // Show quantity selector with modern design
  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      {/* Quantity Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={selectedQuantity <= minQty}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 transition disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-lg"
            aria-label="Azalt"
          >
            −
          </button>
          <input
            type="number"
            value={selectedQuantity}
            onChange={handleInputChange}
            min={minQty}
            className="w-16 text-center border-x-2 border-slate-200 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:z-10"
            aria-label="Miktar"
          />
          <button
            type="button"
            onClick={handleIncrement}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 transition font-semibold text-lg"
            aria-label="Artır"
          >
            +
          </button>
        </div>
        {product.packageInfo && (
          <span className="text-sm text-slate-600">
            {product.packageInfo.boxLabel}
          </span>
        )}
      </div>

      {/* Quantity Info */}
      {product.packageInfo && (
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {selectedQuantity} {product.packageInfo.boxLabel.toLowerCase()} = {(selectedQuantity * product.packageInfo.itemsPerBox).toLocaleString("tr-TR")} adet
          </span>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isPending}
        className={variantClasses[variant]}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Ekleniyor...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {buttonText}
          </span>
        )}
      </button>
    </div>
  );
}
