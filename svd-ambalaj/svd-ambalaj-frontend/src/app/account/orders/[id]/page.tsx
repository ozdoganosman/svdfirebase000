"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/auth-guard";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/svdfirebase000/us-central1/api";

interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  subtotal: number;
  category?: string;
  packageInfo?: {
    itemsPerBox?: number;
    boxLabel?: string;
  };
  totalItemCount?: number; // Actual item count (for packaged products)
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    address?: string;
    city?: string;
  };
  items: OrderItem[];
  totals: {
    subtotal: number;
    currency: string;
    total: number;
    discountTotal?: number;
    comboDiscount?: number;
    finalTotal?: number;
  };
  trackingNumber?: string;
  trackingUrl?: string;
  adminNotes?: string;
  notes?: string;
  shippingAddress?: string;
  billingAddress?: string;
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
          throw new Error(errorData.error || "Siparis yuklenemedi");
        }

        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err instanceof Error ? err.message : "Siparis yuklenirken hata olustu");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user, resolvedParams.id]);

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "completed":
      case "teslim edildi":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
      case "kargoda":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
      case "hazirlanıyor":
      case "beklemede":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
      case "iptal edildi":
        return "bg-red-100 text-red-700 border-red-200";
      case "confirmed":
      case "onaylandi":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "completed":
        return "Teslim Edildi";
      case "shipped":
        return "Kargoda";
      case "pending":
        return "Beklemede";
      case "cancelled":
        return "Iptal Edildi";
      case "confirmed":
        return "Onaylandi";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        <div className="mx-auto max-w-4xl px-6 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 mb-4"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Siparislerime Don
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">Siparis Detayi</h1>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
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
              <h3 className="mt-4 text-lg font-semibold text-red-800">{error}</h3>
              <Link
                href="/account/orders"
                className="mt-4 inline-block text-amber-600 hover:text-amber-700 font-medium"
              >
                Siparislerime Don
              </Link>
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Order Summary Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{order.orderNumber}</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Tracking Info */}
                {order.trackingNumber && (
                  <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">Kargo Bilgileri</h3>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Takip No:</span> {order.trackingNumber}
                    </p>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                      >
                        Kargoyu Takip Et
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}

                {/* Admin Notes */}
                {order.adminNotes && (
                  <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">Not</h3>
                    <p className="text-sm text-amber-700">{order.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Siparis Icerigi</h3>
                <div className="divide-y divide-slate-100">
                  {order.items.map((item, index) => {
                    // Calculate actual item count
                    const actualItemCount = item.totalItemCount ||
                      (item.packageInfo?.itemsPerBox
                        ? item.quantity * item.packageInfo.itemsPerBox
                        : item.quantity);

                    return (
                      <div key={index} className="py-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.title}</p>
                          {item.packageInfo?.itemsPerBox ? (
                            <div className="text-sm text-slate-600">
                              <p>{item.quantity} {item.packageInfo.boxLabel || 'koli'} x {item.packageInfo.itemsPerBox} adet = {actualItemCount} adet</p>
                              <p className="text-slate-500">Birim fiyat: {formatPrice(item.price, order.totals.currency)}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-600">
                              {actualItemCount} adet x {formatPrice(item.price, order.totals.currency)}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold text-slate-800">
                          {formatPrice(item.subtotal, order.totals.currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Ara Toplam</span>
                    <span className="font-medium">{formatPrice(order.totals.subtotal, order.totals.currency)}</span>
                  </div>
                  {order.totals.comboDiscount && order.totals.comboDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Kombo Indirimi</span>
                      <span>-{formatPrice(order.totals.comboDiscount, order.totals.currency)}</span>
                    </div>
                  )}
                  {order.totals.discountTotal && order.totals.discountTotal > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Indirim</span>
                      <span>-{formatPrice(order.totals.discountTotal, order.totals.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                    <span>Toplam</span>
                    <span className="text-amber-600">{formatPrice(order.totals.total, order.totals.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Musteri Bilgileri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Ad Soyad</p>
                    <p className="font-medium text-slate-800">{order.customer.name}</p>
                  </div>
                  {order.customer.company && (
                    <div>
                      <p className="text-sm text-slate-500">Firma</p>
                      <p className="font-medium text-slate-800">{order.customer.company}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">E-posta</p>
                    <p className="font-medium text-slate-800">{order.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Telefon</p>
                    <p className="font-medium text-slate-800">{order.customer.phone}</p>
                  </div>
                  {order.customer.address && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-slate-500">Adres</p>
                      <p className="font-medium text-slate-800">
                        {order.customer.address}
                        {order.customer.city && `, ${order.customer.city}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Siparis Notu</h3>
                  <p className="text-slate-600">{order.notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
}
