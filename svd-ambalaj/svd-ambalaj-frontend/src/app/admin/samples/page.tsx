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

const carrierOptions = [
  { value: "", label: "Kargo Firması Seçin" },
  { value: "Yurtiçi Kargo", label: "Yurtiçi Kargo" },
  { value: "Aras Kargo", label: "Aras Kargo" },
  { value: "MNG Kargo", label: "MNG Kargo" },
  { value: "PTT Kargo", label: "PTT Kargo" },
  { value: "Sürat Kargo", label: "Sürat Kargo" },
  { value: "UPS", label: "UPS" },
  { value: "FedEx", label: "FedEx" },
  { value: "DHL", label: "DHL" },
  { value: "Trendyol Express", label: "Trendyol Express" },
  { value: "Hepsijet", label: "Hepsijet" },
  { value: "Getir", label: "Getir" },
  { value: "Diğer", label: "Diğer" },
];

export default function AdminSamplesPage() {
  const [samples, setSamples] = useState<AdminSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<AdminSample | null>(null);
  const [shippingForm, setShippingForm] = useState({ carrier: "", trackingNumber: "" });

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

  const handleStatusChange = async (sampleId: string, newStatus: string, shippingInfo?: { carrier: string; trackingNumber: string }) => {
    setUpdatingId(sampleId);
    setError(null);
    setSuccessMessage(null);
    try {
      const body: { status: string; carrier?: string; trackingNumber?: string } = { status: newStatus };
      if (shippingInfo) {
        body.carrier = shippingInfo.carrier;
        body.trackingNumber = shippingInfo.trackingNumber;
      }
      await apiFetch(`/samples/${sampleId}/status`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      await fetchSamples();
      setSuccessMessage(`Numune durumu "${statusLabels[newStatus] ?? newStatus}" olarak güncellendi`);
      setSelectedSample(null);
      setShippingForm({ carrier: "", trackingNumber: "" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleShipSample = async (sampleId: string) => {
    if (!shippingForm.carrier) {
      setError("Lütfen kargo firması seçin");
      return;
    }
    if (!shippingForm.trackingNumber) {
      setError("Lütfen kargo takip numarası girin");
      return;
    }
    await handleStatusChange(sampleId, "shipped", shippingForm);
  };

  const openSampleModal = (sample: AdminSample) => {
    setSelectedSample(sample);
    // Pre-fill shipping form if sample already has shipping info
    setShippingForm({
      carrier: sample.carrier || "",
      trackingNumber: sample.trackingNumber || "",
    });
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
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {/* Left side - Info */}
                  <div className="space-y-3 flex-1">
                    {/* Header */}
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

                    {/* Customer Info */}
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{sample.customer.name}</p>
                      {sample.customer.company && <p>{sample.customer.company}</p>}
                      {sample.customer.phone && <p>{sample.customer.phone}</p>}
                      {sample.customer.email && <p>{sample.customer.email}</p>}
                    </div>

                    {/* Shipping Info */}
                    {(sample.carrier || sample.trackingNumber) && (
                      <div className="text-sm space-y-1 p-2 bg-slate-50 rounded-md">
                        {sample.carrier && (
                          <div>
                            <span className="text-slate-500">Kargo:</span>
                            <span className="ml-2 font-medium text-slate-900">{sample.carrier}</span>
                          </div>
                        )}
                        {sample.trackingNumber && (
                          <div>
                            <span className="text-slate-500">Takip No:</span>
                            <span className="ml-2 font-mono font-medium text-slate-900">{sample.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right text-sm">
                      <p className="font-semibold text-slate-900">Toplam</p>
                      <p className="text-lg font-semibold text-amber-600">
                        {currencyFormatter.format(sample.shippingFee)}
                      </p>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex flex-wrap justify-end gap-2">
                      {statusOptions
                        .filter((option) => option.value !== "all")
                        .map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              if (option.value === "shipped" && sample.status !== "shipped") {
                                openSampleModal(sample);
                              } else {
                                handleStatusChange(sample.id, option.value);
                              }
                            }}
                            disabled={updatingId === sample.id || sample.status === option.value}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white ${
                              sample.status === option.value
                                ? 'border border-amber-200 bg-amber-50 text-amber-600'
                                : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                            } ${updatingId === sample.id ? 'opacity-60' : ''}`}
                          >
                            {option.label}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <h3 className="text-sm font-semibold text-slate-900">Numune Kalemleri</h3>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-700">Ürün</th>
                          <th className="px-3 py-2 text-right font-medium text-slate-700">Adet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sample.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-700">{item.title}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                onClick={() => setSelectedSample(null)}
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

            {/* Shipping Info (for shipped samples) */}
            {(selectedSample.status === "shipped" || selectedSample.status === "delivered") && (
              <div className="mb-4 rounded-lg border border-slate-200 p-4">
                <h3 className="mb-2 font-semibold text-slate-900">Kargo Bilgileri</h3>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-slate-500">Kargo Firması:</span>
                    <span className="ml-2 font-medium">{selectedSample.carrier || "Belirtilmedi"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Takip No:</span>
                    <span className="ml-2 font-mono font-medium">{selectedSample.trackingNumber || "Girilmedi"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Form - shown when shipping is needed */}
            {selectedSample.status !== "shipped" && selectedSample.status !== "delivered" && selectedSample.status !== "rejected" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <h4 className="mb-3 font-semibold text-indigo-900">Kargo Bilgileri</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Kargo Firması <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={shippingForm.carrier}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, carrier: e.target.value }))}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      >
                        {carrierOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Kargo Takip Numarası <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingForm.trackingNumber}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                        placeholder="Takip numarasını girin..."
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleShipSample(selectedSample.id)}
                  disabled={updatingId === selectedSample.id || !shippingForm.carrier || !shippingForm.trackingNumber}
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === selectedSample.id ? "İşleniyor..." : "Kargoya Ver"}
                </button>
              </div>
            )}

            {/* Shipped - show delivered button */}
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

            {/* Final states */}
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
