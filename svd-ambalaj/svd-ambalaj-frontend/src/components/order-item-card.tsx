"use client";

import Image from "next/image";
import { useState } from "react";

interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  priceUSD?: number;
  subtotal: number;
  category?: string;
  imageUrl?: string;
  slug?: string;
  packageInfo?: {
    itemsPerBox?: number;
    boxLabel?: string;
  };
  totalItemCount?: number;
  variant?: string;
}

interface OrderItemCardProps {
  item: OrderItem;
  currency?: string;
  exchangeRate?: number;
  taxRate?: number;
  showAddToCart?: boolean;
  onAddToCart?: (item: OrderItem) => void;
}

function formatPrice(price: number, currency: string = "TRY"): string {
  return price.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " " + currency;
}

function formatUSD(price: number): string {
  return "$" + price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function OrderItemCard({
  item,
  currency = "TRY",
  exchangeRate,
  taxRate = 20,
  showAddToCart = false,
  onAddToCart
}: OrderItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasPackageInfo = item.packageInfo?.itemsPerBox && item.packageInfo.itemsPerBox > 1;

  // Calculate USD price if not provided but we have exchange rate
  const priceUSD = item.priceUSD || (exchangeRate ? item.price / exchangeRate : null);
  const subtotalUSD = exchangeRate ? item.subtotal / exchangeRate : null;

  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
      {/* Product Image with Quantity Badge */}
      <div className="relative h-20 w-20 flex-shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-slate-100">
          {item.imageUrl && !imageError ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-contain p-1"
              sizes="80px"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>
        {/* Quantity Badge */}
        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-md ring-2 ring-white">
          {item.quantity}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h4 className="font-medium text-slate-800 line-clamp-2">{item.title}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {item.category && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{item.category}</span>
            )}
            {item.variant && (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{item.variant}</span>
            )}
          </div>
        </div>

        {/* Quantity Info */}
        <div className="mt-2 flex items-center gap-4 text-sm">
          {hasPackageInfo ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-slate-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-semibold text-amber-600">{item.quantity}</span> {item.packageInfo?.boxLabel || "kutu"}
              </span>
              <span className="text-slate-400">×</span>
              <span className="text-slate-600">{item.packageInfo?.itemsPerBox} adet</span>
              <span className="text-slate-400">=</span>
              <span className="font-medium text-slate-800">{item.totalItemCount || item.quantity * (item.packageInfo?.itemsPerBox || 1)} adet</span>
            </div>
          ) : (
            <span className="text-slate-600">
              <span className="font-semibold text-amber-600">{item.quantity}</span> adet
            </span>
          )}
        </div>
      </div>

      {/* Price and Actions */}
      <div className="flex flex-col items-end justify-between min-w-[120px]">
        {/* Unit Price */}
        <div className="text-right">
          <p className="text-xs text-slate-500">Birim Fiyat</p>
          <p className="text-sm font-medium text-slate-700">{formatPrice(item.price, currency)}</p>
          {priceUSD && (
            <p className="text-xs text-slate-400">{formatUSD(priceUSD)}</p>
          )}
          <p className="text-[10px] text-slate-400">+KDV</p>
        </div>

        {/* Total Price */}
        <div className="text-right mt-2">
          <p className="text-xs text-slate-500">Toplam</p>
          <p className="text-lg font-bold text-amber-600">{formatPrice(item.subtotal, currency)}</p>
          {subtotalUSD && (
            <p className="text-xs text-slate-500">{formatUSD(subtotalUSD)}</p>
          )}
          <p className="text-[10px] text-slate-400">+KDV</p>
        </div>

        {showAddToCart && onAddToCart && (
          <button
            onClick={() => onAddToCart(item)}
            className="mt-2 flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Sepete Ekle
          </button>
        )}
      </div>
    </div>
  );
}

// Compact variant for order list preview
export function OrderItemPreview({ items, maxShow = 3 }: { items: OrderItem[]; maxShow?: number }) {
  const visibleItems = items.slice(0, maxShow);
  const remainingCount = items.length - maxShow;

  return (
    <div className="flex items-center gap-2">
      {/* Product Images with Quantity Badges */}
      <div className="flex -space-x-2">
        {visibleItems.map((item, index) => (
          <div
            key={item.id || index}
            className="relative"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-lg border-2 border-white bg-slate-100 shadow-sm">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-contain p-0.5"
                  sizes="40px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>
            {/* Mini Quantity Badge */}
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-1 ring-white">
              {item.quantity}
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-slate-200 text-xs font-medium text-slate-600 shadow-sm">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Item Count */}
      <span className="text-sm text-slate-500">
        {items.length} ürün
      </span>
    </div>
  );
}
