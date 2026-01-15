"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/auth-guard";
import { OrderStatusTimeline, getStatusColor, getStatusLabel } from "@/components/order-status-timeline";
import { OrderItemCard } from "@/components/order-item-card";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/svdfirebase000/us-central1/api";

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

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
  exchangeRate?: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    address?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  };
  items: OrderItem[];
  totals: {
    subtotal: number;
    currency: string;
    total: number;
    discountTotal?: number;
    comboDiscount?: number;
    finalTotal?: number;
    shipping?: number;
  };
  trackingNumber?: string;
  trackingUrl?: string;
  carrierName?: string;
  adminNotes?: string;
  notes?: string;
  shippingAddress?: string;
  billingAddress?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${apiBase}/user/orders/${resolvedParams.id}?userId=${user.uid}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Sipariş yüklenemedi");
        }

        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err instanceof Error ? err.message : "Sipariş yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user, resolvedParams.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string = "TRY") => {
    return price.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " " + currency;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-600">Sipariş yükleniyor...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-red-800">{error}</h3>
              <Link
                href="/account/orders"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Siparişlerime Dön
              </Link>
            </div>
          ) : order ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 transition-colors mb-4"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Siparişlerime Dön
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        Sipariş #{order.orderNumber}
                      </h1>
                      <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-2">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-500 bg-white px-4 py-2.5 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Tekrar Sipariş Ver
                    </Link>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-4">
                  Sipariş Durumu
                </h2>
                <OrderStatusTimeline
                  status={order.status}
                  variant="horizontal"
                  createdAt={order.createdAt}
                  shippedAt={order.shippedAt}
                  deliveredAt={order.deliveredAt}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Order Items */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Tracking Info */}
                  {order.trackingNumber && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-800">Kargo Bilgileri</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            {order.carrierName && <span className="font-medium">{order.carrierName} - </span>}
                            Takip No: <span className="font-mono font-medium">{order.trackingNumber}</span>
                          </p>
                          {order.trackingUrl && (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Kargoyu Takip Et
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {order.adminNotes && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-amber-800">Satıcı Notu</h3>
                          <p className="text-sm text-amber-700 mt-1">{order.adminNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                      <h2 className="font-semibold text-slate-800">
                        Sipariş İçeriği ({order.items.length} ürün)
                      </h2>
                    </div>
                    <div className="p-4 space-y-3">
                      {order.items.map((item, index) => (
                        <OrderItemCard
                          key={item.id || index}
                          item={item}
                          currency={order.totals.currency}
                          exchangeRate={order.exchangeRate}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {order.notes && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="font-semibold text-slate-800 mb-3">Sipariş Notunuz</h3>
                      <p className="text-slate-600 bg-slate-50 rounded-lg p-4">{order.notes}</p>
                    </div>
                  )}
                </div>

                {/* Sidebar - Summary & Customer Info */}
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                      <h2 className="font-semibold text-slate-800">Sipariş Özeti</h2>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Ara Toplam</span>
                        <div className="text-right">
                          <span className="font-medium text-slate-800">
                            {formatPrice(order.totals.subtotal, order.totals.currency)}
                          </span>
                          {order.exchangeRate && (
                            <p className="text-xs text-slate-400">
                              ${(order.totals.subtotal / order.exchangeRate).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      {order.totals.comboDiscount && order.totals.comboDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Kombo İndirimi</span>
                          <div className="text-right">
                            <span className="font-medium text-green-600">
                              -{formatPrice(order.totals.comboDiscount, order.totals.currency)}
                            </span>
                            {order.exchangeRate && (
                              <p className="text-xs text-green-500">
                                -${(order.totals.comboDiscount / order.exchangeRate).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {order.totals.discountTotal && order.totals.discountTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">İndirim</span>
                          <div className="text-right">
                            <span className="font-medium text-green-600">
                              -{formatPrice(order.totals.discountTotal, order.totals.currency)}
                            </span>
                            {order.exchangeRate && (
                              <p className="text-xs text-green-500">
                                -${(order.totals.discountTotal / order.exchangeRate).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {order.totals.shipping !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Kargo</span>
                          <span className="font-medium text-slate-800">
                            {order.totals.shipping === 0
                              ? "Ücretsiz"
                              : formatPrice(order.totals.shipping, order.totals.currency)}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-lg font-semibold text-slate-800">Toplam</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">+KDV</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-amber-600">
                              {formatPrice(order.totals.total, order.totals.currency)}
                            </span>
                            {order.exchangeRate && (
                              <p className="text-sm text-slate-500">
                                ${(order.totals.total / order.exchangeRate).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                      <h2 className="font-semibold text-slate-800">Müşteri Bilgileri</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Ad Soyad</p>
                        <p className="mt-1 font-medium text-slate-800">{order.customer.name}</p>
                      </div>

                      {order.customer.company && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Firma</p>
                          <p className="mt-1 font-medium text-slate-800">{order.customer.company}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">E-posta</p>
                        <p className="mt-1 text-slate-700">{order.customer.email}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Telefon</p>
                        <p className="mt-1 text-slate-700">{order.customer.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {order.customer.address && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                        <h2 className="font-semibold text-slate-800">Teslimat Adresi</h2>
                      </div>
                      <div className="p-6">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-slate-700">{order.customer.address}</p>
                            <p className="text-slate-600 mt-1">
                              {order.customer.district && `${order.customer.district}, `}
                              {order.customer.city}
                              {order.customer.postalCode && ` ${order.customer.postalCode}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Info */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                      <h2 className="font-semibold text-slate-800">Sipariş Bilgileri</h2>
                    </div>
                    <div className="p-6 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sipariş No</span>
                        <span className="font-mono font-medium text-slate-800">{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sipariş Tarihi</span>
                        <span className="text-slate-800">{formatShortDate(order.createdAt)}</span>
                      </div>
                      {order.exchangeRate && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Döviz Kuru</span>
                          <span className="font-medium text-amber-600">1 USD = {order.exchangeRate.toFixed(2)} TRY</span>
                        </div>
                      )}
                      {order.shippedAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Kargoya Verildi</span>
                          <span className="text-slate-800">{formatShortDate(order.shippedAt)}</span>
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Teslim Edildi</span>
                          <span className="text-slate-800">{formatShortDate(order.deliveredAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
}
