'use client';

import { useEffect, useMemo, useState } from "react";
import { AdminSample, apiFetch } from "@/lib/admin-api";

const statusOptions = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "requested", label: "Talep Edildi" },
  { value: "approved", label: "Onaylandı" },
  { value: "preparing", label: "Hazırlanıyor" },
  { value: "shipped", label: "Kargolandı" },
  { value: "delivered", label: "Teslim Edildi" },
  { value: "rejected", label: "Reddedildi" },
];

const statusLabels: Record<string, string> = {
  requested: "Talep Edildi",
  approved: "Onaylandı",
  preparing: "Hazırlanıyor",
  shipped: "Kargolandı",
  delivered: "Teslim Edildi",
  rejected: "Reddedildi",
};

const statusColors: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  preparing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export default function AdminSamplesPage() {
  const [samples, setSamples] = useState<AdminSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<AdminSample | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  const fetchSamples = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ samples: AdminSample[] }>("/admin/samples");
      setSamples(response.samples ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const filteredSamples = useMemo(() => {
    if (statusFilter === "all") {
      return samples;
    }
    return samples.filter((sample) => sample.status === statusFilter);
  }, [samples, statusFilter]);

  const handleStatusChange = async (sampleId: string, newStatus: string) => {
    setUpdatingId(sampleId);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiFetch(`/samples/${sampleId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchSamples();
      setSuccessMessage(`Numune durumu "${statusLabels[newStatus] ?? newStatus}" olarak güncellendi`);
      setSelectedSample(null);
      setTrackingNumber("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openSampleModal = (sample: AdminSample) => {
    setSelectedSample(sample);
    setTrackingNumber(sample.trackingNumber || "");
  };

  const closeSampleModal = () => {
    setSelectedSample(null);
    setTrackingNumber("");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Numune Talepleri</h1>
            <p className="text-sm text-slate-600">
              Gelen numune taleplerini görüntüleyin, onaylayın ve kargo takibini yönetin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchSamples}
              disabled={loading}
              className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-400"
            >
              Yenile
            </button>
          </div>
        </div>
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
        {successMessage && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
            {successMessage}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Numune talepleri yükleniyor...</div>
        ) : filteredSamples.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Seçili duruma ait numune talebi bulunamadı.</div>
        ) : (
          <div className="space-y-5">
            {filteredSamples.map((sample) => (
              <article key={sample.id} className="rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {sample.sampleNumber || `#${sample.id.substring(0, 8)}`}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[sample.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                        {statusLabels[sample.status] ?? sample.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(sample.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSampleModal(sample)}
                      className="text-sm font-medium text-amber-600 hover:text-amber-700"
                    >
                      Detaylar →
                    </button>
                  </div>

                  {/* Customer Info */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{sample.customer.name}</p>
                      {sample.customer.company && <p>{sample.customer.company}</p>}
                      {sample.customer.phone && <p>{sample.customer.phone}</p>}
                      {sample.customer.email && <p>{sample.customer.email}</p>}
                    </div>
                    {sample.trackingNumber && (
                      <div className="text-sm">
                        <span className="text-slate-500">Kargo Takip:</span>
                        <span className="ml-2 font-mono font-medium text-slate-900">{sample.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Ürünler ({sample.items.length} ürün, {sample.items.reduce((sum, item) => sum + item.quantity, 0)} adet)
                    </p>
                    <div className="space-y-1">
                      {sample.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-xs text-slate-600">
                          {item.title} × {item.quantity} adet
                        </div>
                      ))}
                      {sample.items.length > 3 && (
                        <p className="text-xs text-slate-500">+{sample.items.length - 3} ürün daha...</p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Fee and Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-xs text-slate-500">Kargo Ücreti</p>
                      <p className="text-lg font-bold text-slate-900">
                        {currencyFormatter.format(sample.shippingFee)} <span className="text-xs text-slate-500">(KDV Dahil)</span>
                      </p>
                    </div>
                    {sample.status === "requested" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openSampleModal(sample)}
                          disabled={updatingId === sample.id}
                          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          İncele
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Sample Detail Modal */}
      {selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Numune Talebi Detayları
                </h2>
                <p className="text-sm text-slate-600">
                  {selectedSample.sampleNumber || `#${selectedSample.id.substring(0, 8)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSampleModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Customer Details */}
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 font-semibold text-slate-900">Müşteri Bilgileri</h3>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <span className="text-slate-500">Ad Soyad:</span>
                  <span className="ml-2 font-medium">{selectedSample.customer.name}</span>
                </div>
                {selectedSample.customer.company && (
                  <div>
                    <span className="text-slate-500">Firma:</span>
                    <span className="ml-2 font-medium">{selectedSample.customer.company}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Telefon:</span>
                  <span className="ml-2 font-medium">{selectedSample.customer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500">E-posta:</span>
                  <span className="ml-2 font-medium">{selectedSample.customer.email}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4 rounded-lg border border-slate-200 p-4">
              <h3 className="mb-3 font-semibold text-slate-900">Talep Edilen Ürünler</h3>
              <div className="space-y-2">
                {selectedSample.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{item.quantity} adet</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-slate-900">Kargo Ücreti</span>
                  <span className="text-amber-600">{currencyFormatter.format(selectedSample.shippingFee)} (KDV Dahil)</span>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {selectedSample.notes && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Müşteri Notu</h3>
                <p className="text-sm text-slate-700">{selectedSample.notes}</p>
              </div>
            )}

            {/* Tracking Number (for shipped samples) */}
            {(selectedSample.status === "shipped" || selectedSample.status === "delivered") && (
              <div className="mb-4 rounded-lg border border-slate-200 p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Kargo Takip Numarası</h3>
                <p className="font-mono text-lg text-slate-900">{selectedSample.trackingNumber || "Girilmedi"}</p>
              </div>
            )}

            {/* Actions */}
            {selectedSample.status === "requested" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedSample.id, "approved")}
                  disabled={updatingId === selectedSample.id}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === selectedSample.id ? "İşleniyor..." : "Onayla"}
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedSample.id, "rejected")}
                  disabled={updatingId === selectedSample.id}
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === selectedSample.id ? "İşleniyor..." : "Reddet"}
                </button>
              </div>
            )}
            {selectedSample.status === "approved" && (
              <button
                type="button"
                onClick={() => handleStatusChange(selectedSample.id, "preparing")}
                disabled={updatingId === selectedSample.id}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === selectedSample.id ? "İşleniyor..." : "Hazırlanıyor Olarak İşaretle"}
              </button>
            )}
            {selectedSample.status === "preparing" && (
              <button
                type="button"
                onClick={() => handleStatusChange(selectedSample.id, "shipped")}
                disabled={updatingId === selectedSample.id}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === selectedSample.id ? "İşleniyor..." : "Kargoya Verildi Olarak İşaretle"}
              </button>
            )}
            {selectedSample.status === "shipped" && (
              <button
                type="button"
                onClick={() => handleStatusChange(selectedSample.id, "delivered")}
                disabled={updatingId === selectedSample.id}
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === selectedSample.id ? "İşleniyor..." : "Teslim Edildi Olarak İşaretle"}
              </button>
            )}
            {(selectedSample.status === "rejected" || selectedSample.status === "delivered") && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
                Bu numune talebi <span className="font-semibold">{statusLabels[selectedSample.status]}</span> durumunda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
