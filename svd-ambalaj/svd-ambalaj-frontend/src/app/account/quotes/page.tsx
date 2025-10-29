"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { resolveServerApiUrl } from "@/lib/server-api";
import Link from "next/link";

type Quote = {
  id: string;
  quoteNumber: string;
  status: "pending" | "approved" | "rejected";
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  };
  paymentTerms: {
    termMonths: number;
    guaranteeType: "check" | "teminat" | "açık";
    guaranteeDetails?: string;
  };
  notes?: string;
  adminNotes?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
};

const statusLabels = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const guaranteeTypeLabels = {
  check: "Çek",
  teminat: "Teminat Mektubu",
  açık: "Açık Hesap",
};

export default function QuotesPage() {
  const { user, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchQuotes = async () => {
      try {
        const response = await fetch(
          resolveServerApiUrl(`/quotes?userId=${user.uid}`)
        );

        if (!response.ok) {
          throw new Error("Teklifler yüklenirken bir hata oluştu.");
        }

        const data = await response.json();
        setQuotes(data.quotes || []);
      } catch (err) {
        console.error("Quote fetch error:", err);
        setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h2 className="text-xl font-semibold text-amber-900">Giriş Yapmanız Gerekiyor</h2>
            <p className="mt-2 text-amber-700">
              Tekliflerinizi görüntülemek için lütfen giriş yapın.
            </p>
            <Link
              href="/auth/login"
              className="mt-4 inline-block rounded-lg bg-amber-500 px-6 py-2 font-semibold text-white transition hover:bg-amber-600"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <span className="inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                Tekliflerim
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
                Teklif Talepleriniz
              </h1>
              <p className="mt-3 text-slate-600">
                Gönderdiğiniz teklif taleplerini buradan takip edebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {quotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Henüz Teklif Talebiniz Yok</h3>
            <p className="mt-2 text-slate-600">
              Sepetinizden teklif talebi oluşturabilirsiniz.
            </p>
            <Link
              href="/cart"
              className="mt-4 inline-block rounded-lg bg-purple-600 px-6 py-2 font-semibold text-white transition hover:bg-purple-700"
            >
              Sepete Git
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {quote.quoteNumber}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusColors[quote.status]
                        }`}
                      >
                        {statusLabels[quote.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(quote.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      ₺{quote.totals.total.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-slate-500">KDV Dahil</p>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="mb-4 rounded-lg bg-purple-50 border border-purple-200 p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Ödeme Şartları</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-700">
                    <div>
                      <span className="font-medium">Vade:</span> {quote.paymentTerms.termMonths} Ay
                    </div>
                    <div>
                      <span className="font-medium">Teminat:</span>{" "}
                      {guaranteeTypeLabels[quote.paymentTerms.guaranteeType]}
                    </div>
                    {quote.paymentTerms.guaranteeDetails && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Detay:</span>{" "}
                        {quote.paymentTerms.guaranteeDetails}
                      </div>
                    )}
                  </div>
                </div>

                {/* Products */}
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Ürünler</h4>
                  <div className="space-y-2">
                    {quote.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                      >
                        <span className="font-medium text-slate-900">{item.title}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-600">{item.quantity} adet</span>
                          <span className="font-semibold text-purple-600">
                            ₺{item.subtotal.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                  <div className="mb-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-700">Notlarınız:</p>
                    <p className="text-sm text-slate-600 mt-1">{quote.notes}</p>
                  </div>
                )}

                {/* Admin Notes (if approved/rejected) */}
                {quote.adminNotes && (
                  <div className={`rounded-lg border p-3 ${
                    quote.status === "approved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}>
                    <p className={`text-sm font-medium ${
                      quote.status === "approved" ? "text-green-700" : "text-red-700"
                    }`}>
                      Admin Notu:
                    </p>
                    <p className={`text-sm mt-1 ${
                      quote.status === "approved" ? "text-green-600" : "text-red-600"
                    }`}>
                      {quote.adminNotes}
                    </p>
                  </div>
                )}

                {/* Valid Until */}
                {quote.validUntil && quote.status === "approved" && (
                  <div className="mt-4 text-sm text-slate-600">
                    <span className="font-medium">Geçerlilik:</span>{" "}
                    {new Date(quote.validUntil).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })} tarihine kadar
                  </div>
                )}

                {/* Convert to Order Button */}
                {quote.status === "approved" && (
                  <div className="mt-6 border-t border-purple-200 pt-4">
                    <Link
                      href={`/checkout?fromQuote=${quote.id}`}
                      className="block w-full rounded-lg bg-purple-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-purple-700"
                    >
                      🛒 Sipariş Ver
                    </Link>
                    <p className="mt-2 text-center text-xs text-slate-500">
                      Bu teklifi onaylayarak sipariş verebilirsiniz
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
