"use client";

import Link from "next/link";
import { OrderStatusTimeline, getStatusColor, getStatusLabel } from "./order-status-timeline";
import { OrderItemPreview } from "./order-item-card";

interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totals: {
    subtotal: number;
    currency: string;
    total: number;
    discount?: number;
    comboDiscount?: number;
    shipping?: number;
  };
  items: OrderItem[];
  trackingNumber?: string;
  trackingUrl?: string;
}

interface OrderSummaryCardProps {
  order: Order;
  variant?: "default" | "compact";
}

function formatPrice(price: number, currency: string = "TRY"): string {
  return price.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " " + currency;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPaymentStatusBadge(order: Order): { show: boolean; label: string; color: string } {
  // Show payment waiting badge for bank transfer orders that are not paid yet
  if (order.paymentMethod === "bank_transfer" && order.paymentStatus !== "paid") {
    return {
      show: true,
      label: "Ödeme Bekleniyor",
      color: "border-orange-200 bg-orange-50 text-orange-700",
    };
  }
  return { show: false, label: "", color: "" };
}

export function OrderSummaryCard({ order, variant = "default" }: OrderSummaryCardProps) {
  const currency = order.totals?.currency || "TRY";

  if (variant === "compact") {
    const paymentBadge = getPaymentStatusBadge(order);

    return (
      <Link
        href={`/account/orders/${order.id}`}
        className="group block rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-amber-200 hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800">#{order.orderNumber}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
              {paymentBadge.show && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${paymentBadge.color}`}>
                  {paymentBadge.label}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{formatShortDate(order.createdAt)}</p>

            {/* Mini Timeline */}
            <div className="mt-3">
              <OrderStatusTimeline status={order.status} variant="mini" />
            </div>
          </div>

          {/* Right: Price and Items */}
          <div className="flex flex-col items-end gap-2">
            <p className="text-lg font-bold text-amber-600">
              {formatPrice(order.totals.total, currency)}
            </p>
            <OrderItemPreview items={order.items} maxShow={3} />
          </div>
        </div>

        {/* Hover indicator */}
        <div className="mt-3 flex items-center justify-end text-sm text-slate-400 group-hover:text-amber-600 transition-colors">
          Detayları Gör
          <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    );
  }

  // Default variant - more detailed
  const paymentBadgeDefault = getPaymentStatusBadge(order);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Sipariş No</p>
            <p className="text-lg font-bold text-slate-800">#{order.orderNumber}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tarih</p>
            <p className="text-sm font-medium text-slate-600">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
          {paymentBadgeDefault.show && (
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${paymentBadgeDefault.color}`}>
              {paymentBadgeDefault.label}
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-4 border-b border-slate-100">
        <OrderStatusTimeline status={order.status} variant="horizontal" createdAt={order.createdAt} />
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Items Preview */}
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3">Ürünler</p>
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={item.id || index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate max-w-[200px]">{item.title}</span>
                  <span className="text-slate-800 font-medium">x{item.quantity}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-xs text-slate-400">+{order.items.length - 3} ürün daha</p>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Toplam</p>
            <p className="text-2xl font-bold text-amber-600">{formatPrice(order.totals.total, currency)}</p>
            {(order.totals.discount || order.totals.comboDiscount) && (
              <p className="mt-1 text-xs text-green-600">
                {formatPrice((order.totals.discount || 0) + (order.totals.comboDiscount || 0), currency)} indirim
              </p>
            )}
          </div>
        </div>

        {/* Tracking Info */}
        {order.trackingNumber && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span className="text-sm text-blue-700">Takip No: {order.trackingNumber}</span>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Kargo Takip →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3">
        <Link
          href={`/account/orders/${order.id}`}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Detayları Gör
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
