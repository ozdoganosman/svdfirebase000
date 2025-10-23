"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/auth-guard";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  currency: string;
  items: number;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // TODO: Implement backend API call
        // const response = await fetch(`/api/orders?userId=${user?.uid}`);
        // const data = await response.json();
        // setOrders(data);
        
        // Temporary mock data
        setOrders([
          {
            id: "1",
            orderNumber: "ORD-2024-0001",
            date: "2024-01-15",
            status: "Teslim Edildi",
            total: 1250.00,
            currency: "TRY",
            items: 3
          },
          {
            id: "2",
            orderNumber: "ORD-2024-0002",
            date: "2024-01-20",
            status: "Kargoda",
            total: 850.00,
            currency: "TRY",
            items: 2
          }
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Teslim Edildi":
        return "bg-green-100 text-green-700 border-green-200";
      case "Kargoda":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Hazırlanıyor":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "İptal Edildi":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 mb-4"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Hesabıma Dön
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">Siparişlerim</h1>
            <p className="text-slate-600 mt-2">
              Tüm sipariş geçmişinizi ve durumlarını görüntüleyin
            </p>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">
                Henüz siparişiniz yok
              </h3>
              <p className="mt-2 text-slate-600">
                Ürünlerimize göz atın ve ilk siparişinizi verin
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-amber-700"
              >
                Ürünleri İncele
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {order.orderNumber}
                        </h3>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {new Date(order.date).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          <span>{order.items} ürün</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800">
                          {order.total.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}{" "}
                          <span className="text-lg font-semibold text-slate-600">
                            {order.currency}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-500 bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                      >
                        Detayları Gör
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
