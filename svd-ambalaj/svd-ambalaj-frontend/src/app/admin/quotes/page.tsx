'use client';

import { useEffect, useMemo, useState } from "react";
import { AdminQuote, apiFetch, resolveAdminApiBase } from "@/lib/admin-api";

const statusOptions = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "pending", label: "Beklemede" },
  { value: "approved", label: "Onaylandı" },
  { value: "rejected", label: "Reddedildi" },
  { value: "converted", label: "Siparişe Dönüştürüldü" },
];

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  converted: "Siparişe Dönüştürüldü",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  converted: "bg-blue-100 text-blue-800 border-blue-200",
};

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<AdminQuote | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ quotes: AdminQuote[] }>("/admin/quotes");
      setQuotes(response.quotes ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const filteredQuotes = useMemo(() => {
    if (statusFilter === "all") {
      return quotes;
    }
    return quotes.filter((quote) => quote.status === statusFilter);
  }, [quotes, statusFilter]);

  const handleStatusChange = async (quoteId: string, newStatus: string, notes: string = "") => {
    setUpdatingId(quoteId);
    setError(null);
    setSuccessMessage(null);
    try {
      // Prepare edited items if prices were changed
      const editedItems = selectedQuote?.items.map((item) => ({
        id: item.id,
        price: editedPrices[item.id] ?? item.price,
        subtotal: (editedPrices[item.id] ?? item.price) * item.quantity
      }));

      await apiFetch(`/quotes/${quoteId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          adminNotes: notes,
          editedItems: editedItems
        }),
      });
      await fetchQuotes();
      setSuccessMessage(`Teklif durumu "${statusLabels[newStatus] ?? newStatus}" olarak güncellendi`);
      setSelectedQuote(null);
      setAdminNotes("");
      setEditedPrices({});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openQuoteModal = (quote: AdminQuote) => {
    setSelectedQuote(quote);
    setAdminNotes(quote.adminNotes || "");
    // Initialize edited prices with current prices
    const prices: Record<string, number> = {};
    quote.items.forEach((item) => {
      prices[item.id] = item.price;
    });
    setEditedPrices(prices);
  };

  const closeQuoteModal = () => {
    setSelectedQuote(null);
    setAdminNotes("");
    setEditedPrices({});
  };

  const handleDownloadPDF = (quoteId: string) => {
    const apiBase = resolveAdminApiBase();
    const pdfUrl = `${apiBase}/quotes/${quoteId}/pdf`;
    window.open(pdfUrl, "_blank");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Teklif Yönetimi</h1>
            <p className="text-sm text-slate-600">
              Gelen teklif taleplerini görüntüleyin, onaylayın veya reddedin.
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
              onClick={fetchQuotes}
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
          <div className="py-8 text-center text-sm text-slate-500">Teklifler yükleniyor...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Seçili duruma ait teklif bulunamadı.</div>
        ) : (
          <div className="space-y-5">
            {filteredQuotes.map((quote) => (
              <article key={quote.id} className="rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {quote.quoteNumber || `#${quote.id.substring(0, 8)}`}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[quote.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                        {statusLabels[quote.status] ?? quote.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(quote.createdAt).toLocaleString("tr-TR")}
                      </span>
                      {quote.validUntil && (
                        <span className="text-xs text-amber-600">
                          Geçerlilik: {new Date(quote.validUntil).toLocaleDateString("tr-TR")}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openQuoteModal(quote)}
                      className="text-sm font-medium text-amber-600 hover:text-amber-700"
                    >
                      Detaylar →
                    </button>
                  </div>

                  {/* Customer Info */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{quote.customer.name}</p>
                      {quote.customer.company && <p>{quote.customer.company}</p>}
                      {quote.customer.phone && <p>{quote.customer.phone}</p>}
                      {quote.customer.email && <p>{quote.customer.email}</p>}
                    </div>
                    <div className="text-sm text-slate-600">
                      {quote.customer.taxNumber && <p>Vergi No: {quote.customer.taxNumber}</p>}
                      {quote.customer.city && <p>{quote.customer.city}</p>}
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Ürünler ({quote.items.length} ürün, {quote.items.reduce((sum, item) => sum + item.quantity, 0)} adet)
                    </p>
                    <div className="space-y-1">
                      {quote.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-slate-600">
                          <span>{item.title} × {item.quantity}</span>
                          <span>{currencyFormatter.format(item.subtotal)}</span>
                        </div>
                      ))}
                      {quote.items.length > 3 && (
                        <p className="text-xs text-slate-500">+{quote.items.length - 3} ürün daha...</p>
                      )}
                    </div>
                  </div>

                  {/* Total and Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-xs text-slate-500">Toplam Tutar</p>
                      <p className="text-lg font-bold text-slate-900">
                        {currencyFormatter.format(quote.totals.total)}
                      </p>
                      {quote.paymentTerms.termMonths > 0 && (
                        <p className="text-xs text-amber-600">
                          Vade: {quote.paymentTerms.termMonths} ay
                        </p>
                      )}
                    </div>
                    {quote.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openQuoteModal(quote)}
                          disabled={updatingId === quote.id}
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

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Teklif Detayları
                </h2>
                <p className="text-sm text-slate-600">
                  {selectedQuote.quoteNumber || `#${selectedQuote.id.substring(0, 8)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(selectedQuote.id)}
                  className="rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700"
                  title="PDF İndir"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={closeQuoteModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 font-semibold text-slate-900">Müşteri Bilgileri</h3>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <span className="text-slate-500">Ad Soyad:</span>
                  <span className="ml-2 font-medium">{selectedQuote.customer.name}</span>
                </div>
                {selectedQuote.customer.company && (
                  <div>
                    <span className="text-slate-500">Firma:</span>
                    <span className="ml-2 font-medium">{selectedQuote.customer.company}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Telefon:</span>
                  <span className="ml-2 font-medium">{selectedQuote.customer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500">E-posta:</span>
                  <span className="ml-2 font-medium">{selectedQuote.customer.email}</span>
                </div>
                {selectedQuote.customer.taxNumber && (
                  <div>
                    <span className="text-slate-500">Vergi No:</span>
                    <span className="ml-2 font-medium">{selectedQuote.customer.taxNumber}</span>
                  </div>
                )}
                {selectedQuote.customer.city && (
                  <div>
                    <span className="text-slate-500">Şehir:</span>
                    <span className="ml-2 font-medium">{selectedQuote.customer.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="mb-4 rounded-lg border border-slate-200 p-4">
              <h3 className="mb-3 font-semibold text-slate-900">Ürünler</h3>
              <div className="space-y-3">
                {selectedQuote.items.map((item) => {
                  const editedPrice = editedPrices[item.id] ?? item.price;
                  const editedSubtotal = editedPrice * item.quantity;
                  return (
                    <div key={item.id} className="grid grid-cols-4 gap-3 items-center border-b border-slate-100 pb-3 last:border-0">
                      <div className="col-span-2">
                        <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.quantity} adet</p>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Birim Fiyat</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editedPrice}
                          onChange={(e) => setEditedPrices({ ...editedPrices, [item.id]: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Toplam</p>
                        <p className="font-semibold text-slate-900 text-sm">{currencyFormatter.format(editedSubtotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                {(() => {
                  const editedSubtotal = selectedQuote.items.reduce((sum, item) => {
                    const price = editedPrices[item.id] ?? item.price;
                    return sum + (price * item.quantity);
                  }, 0);
                  const editedTax = editedSubtotal * 0.20;
                  const editedTotal = editedSubtotal + editedTax;
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Ara Toplam (KDV Hariç)</span>
                        <span className="font-semibold">{currencyFormatter.format(editedSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">KDV (%20)</span>
                        <span className="font-semibold">{currencyFormatter.format(editedTax)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                        <span className="text-slate-900">Genel Toplam</span>
                        <span className="text-amber-600">{currencyFormatter.format(editedTotal)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Payment Terms */}
            <div className="mb-4 rounded-lg border border-slate-200 bg-amber-50 p-4">
              <h3 className="mb-2 font-semibold text-slate-900">Ödeme Şartları</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-slate-600">Vade:</span>
                  <span className="ml-2 font-medium">
                    {selectedQuote.paymentTerms.termMonths === 0 ? "Peşin" : `${selectedQuote.paymentTerms.termMonths} ay`}
                  </span>
                </p>
                {selectedQuote.paymentTerms.guaranteeType && (
                  <p>
                    <span className="text-slate-600">Teminat Türü:</span>
                    <span className="ml-2 font-medium">{selectedQuote.paymentTerms.guaranteeType}</span>
                  </p>
                )}
                {selectedQuote.paymentTerms.guaranteeDetails && (
                  <p className="text-slate-600">{selectedQuote.paymentTerms.guaranteeDetails}</p>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="mb-4">
              <label htmlFor="adminNotes" className="mb-2 block text-sm font-medium text-slate-700">
                Admin Notları
              </label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
                placeholder="Teklif hakkında notlarınızı buraya yazın..."
              />
            </div>

            {/* Actions */}
            {selectedQuote.status === "pending" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedQuote.id, "approved", adminNotes)}
                  disabled={updatingId === selectedQuote.id}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === selectedQuote.id ? "İşleniyor..." : "Onayla"}
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedQuote.id, "rejected", adminNotes)}
                  disabled={updatingId === selectedQuote.id}
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === selectedQuote.id ? "İşleniyor..." : "Reddet"}
                </button>
              </div>
            )}
            {selectedQuote.status !== "pending" && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600">
                Bu teklif <span className="font-semibold">{statusLabels[selectedQuote.status]}</span> durumunda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
