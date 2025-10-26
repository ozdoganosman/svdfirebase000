"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { resolveServerApiUrl } from "@/lib/server-api";
import Link from "next/link";

type Sample = {
  id: string;
  sampleNumber: string;
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
  }>;
  shippingFee: number;
  status: "requested" | "preparing" | "shipped" | "delivered";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

const statusLabels = {
  requested: "Talep Edildi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
};

const statusColors = {
  requested: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-amber-100 text-amber-700 border-amber-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
};

export default function SamplesPage() {
  const { user, loading: authLoading } = useAuth();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchSamples = async () => {
      try {
        const response = await fetch(
          resolveServerApiUrl(`/samples/customer/${user.uid}`)
        );

        if (!response.ok) {
          throw new Error("Numuneler yüklenirken bir hata oluştu.");
        }

        const data = await response.json();
        setSamples(data.samples || []);
      } catch (err) {
        console.error("Sample fetch error:", err);
        setError(err instanceof Error ? err.message : "Bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
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
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
            <h2 className="text-xl font-semibold text-blue-900">Giriş Yapmanız Gerekiyor</h2>
            <p className="mt-2 text-blue-700">
              Numunelerinizi görüntülemek için lütfen giriş yapın.
            </p>
            <Link
              href="/auth/login"
              className="mt-4 inline-block rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white transition hover:bg-blue-600"
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
              <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                Numunelerim
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
                Numune Talepleriniz
              </h1>
              <p className="mt-3 text-slate-600">
                Talep ettiğiniz numuneleri buradan takip edebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {samples.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Henüz Numune Talebiniz Yok</h3>
            <p className="mt-2 text-slate-600">
              Sepetinizden numune talebi oluşturabilirsiniz.
            </p>
            <Link
              href="/cart"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Sepete Git
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {sample.sampleNumber}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusColors[sample.status]
                        }`}
                      >
                        {statusLabels[sample.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(sample.createdAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      ₺{sample.shippingFee.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-slate-500">Kargo Ücreti (KDV Dahil)</p>
                  </div>
                </div>

                {/* Sample Info */}
                <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm font-medium text-blue-900">
                    Her üründen <span className="font-semibold">2 adet</span> numune gönderilecektir.
                  </p>
                </div>

                {/* Products */}
                <div className="mb-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Numune Ürünler</h4>
                  <div className="space-y-2">
                    {sample.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                      >
                        <span className="font-medium text-slate-900">{item.title}</span>
                        <span className="font-semibold text-blue-600">{item.quantity} adet</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {sample.notes && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-700">Notlarınız:</p>
                    <p className="text-sm text-slate-600 mt-1">{sample.notes}</p>
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
