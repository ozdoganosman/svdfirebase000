"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/auth-guard";
import { OrderStats } from "@/components/order-stats";
import { OrderSummaryCard } from "@/components/order-summary-card";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/svdfirebase000/us-central1/api";

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
  };
  items: OrderItem[];
  trackingNumber?: string;
  trackingUrl?: string;
}

type StatusFilter = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiBase}/user/orders?userId=${user.uid}`);

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === "all" ||
      order.status.toLowerCase() === statusFilter ||
      (statusFilter === "pending" && ["pending", "confirmed"].includes(order.status.toLowerCase())) ||
      (statusFilter === "processing" && order.status.toLowerCase() === "processing");

    return matchesSearch && matchesStatus;
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 transition-colors mb-4"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Hesabıma Dön
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Siparişlerim</h1>
                <p className="text-slate-600 mt-1">
                  Tüm sipariş geçmişinizi ve durumlarını görüntüleyin
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 self-start"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Sipariş
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-600">Siparişler yükleniyor...</p>
            </div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <svg
                  className="h-10 w-10 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-800">
                Henüz siparişiniz yok
              </h3>
              <p className="mt-2 text-slate-600 max-w-md mx-auto">
                Ürünlerimize göz atın ve ilk siparişinizi verin. Toptan fiyatlarla kaliteli ambalaj ürünleri sizleri bekliyor.
              </p>
              <Link
                href="/products"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-amber-700"
              >
                Ürünleri İncele
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="mb-8">
                <OrderStats orders={orders} />
              </div>

              {/* Filters */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <svg
                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Sipariş no veya ürün ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Durum:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="all">Tümü</option>
                    <option value="pending">Beklemede</option>
                    <option value="processing">Hazırlanıyor</option>
                    <option value="shipped">Kargoda</option>
                    <option value="delivered">Teslim Edildi</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              {searchQuery || statusFilter !== "all" ? (
                <p className="mb-4 text-sm text-slate-500">
                  {filteredOrders.length} sipariş bulundu
                  {filteredOrders.length !== orders.length && (
                    <button
                      onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                      className="ml-2 text-amber-600 hover:text-amber-700"
                    >
                      Filtreleri temizle
                    </button>
                  )}
                </p>
              ) : null}

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-4 text-slate-600">Arama kriterlerinize uygun sipariş bulunamadı.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <OrderSummaryCard key={order.id} order={order} variant="compact" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
