'use client';

import { useEffect, useState } from "react";
import {
  AdminCustomer,
  VIPTier,
  CustomerSegment,
  VIPTierInfo,
  fetchCustomers,
  setCustomerVIPTier,
  calculateCustomerVIP,
  calculateAllCustomersVIP,
  fetchVIPTiers,
} from "@/lib/admin-api";

const segmentOptions = [
  { value: "all", label: "Tüm Segmentler" },
  { value: "vip", label: "VIP" },
  { value: "high-potential", label: "Yüksek Potansiyelli" },
  { value: "new", label: "Yeni Müşteriler" },
  { value: "passive", label: "Pasif Müşteriler" },
  { value: "standard", label: "Standart" },
];

const segmentLabels: Record<string, string> = {
  vip: "VIP",
  "high-potential": "Yüksek Potansiyelli",
  new: "Yeni Müşteri",
  passive: "Pasif",
  standard: "Standart",
};

const segmentColors: Record<string, string> = {
  vip: "bg-purple-100 text-purple-800 border-purple-200",
  "high-potential": "bg-blue-100 text-blue-800 border-blue-200",
  new: "bg-green-100 text-green-800 border-green-200",
  passive: "bg-gray-100 text-gray-800 border-gray-200",
  standard: "bg-slate-100 text-slate-800 border-slate-200",
};

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [tiers, setTiers] = useState<Record<string, VIPTierInfo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [isCalculatingAll, setIsCalculatingAll] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [customersData, tiersData] = await Promise.all([
        fetchCustomers({
          tier: tierFilter !== "all" ? (tierFilter as VIPTier) : undefined,
          segment: segmentFilter !== "all" ? (segmentFilter as CustomerSegment) : undefined,
        }),
        fetchVIPTiers(),
      ]);
      setCustomers(customersData);
      setTiers(tiersData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFilter, segmentFilter]);

  const handleSetTier = async (userId: string, tier: VIPTier) => {
    setUpdatingId(userId);
    setError(null);
    setSuccessMessage(null);
    try {
      await setCustomerVIPTier(userId, tier);
      await fetchData();
      setSuccessMessage(`VIP tier başarıyla güncellendi`);
      setSelectedCustomer(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCalculateVIP = async (userId: string) => {
    setUpdatingId(userId);
    setError(null);
    setSuccessMessage(null);
    try {
      await calculateCustomerVIP(userId);
      await fetchData();
      setSuccessMessage(`VIP durumu yeniden hesaplandı`);
      setSelectedCustomer(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCalculateAll = async () => {
    setIsCalculatingAll(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const results = await calculateAllCustomersVIP();
      await fetchData();
      setSuccessMessage(`Toplu hesaplama tamamlandı: ${results.success} başarılı, ${results.failed} başarısız`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCalculatingAll(false);
    }
  };

  const getTierBadge = (tier: VIPTier) => {
    if (!tier) return null;
    const tierInfo = tiers[tier.toUpperCase()];
    if (!tierInfo) return null;

    const colors = {
      platinum: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 border-slate-400 shadow-lg",
      gold: "bg-gradient-to-r from-amber-300 to-amber-500 text-amber-900 border-amber-500 shadow-lg",
      silver: "bg-gradient-to-r from-gray-200 to-gray-400 text-gray-900 border-gray-400 shadow-lg",
      bronze: "bg-gradient-to-r from-orange-300 to-orange-500 text-orange-900 border-orange-500 shadow-lg",
    };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${colors[tier]}`}>
        <span>{tierInfo.icon}</span>
        <span>{tierInfo.label}</span>
        <span className="ml-1 text-[10px]">%{tierInfo.discount}</span>
      </span>
    );
  };

  const openCustomerModal = (customer: AdminCustomer) => {
    setSelectedCustomer(customer);
  };

  const closeCustomerModal = () => {
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Müşteri Yönetimi</h1>
            <p className="text-sm text-slate-600">
              Müşterileri görüntüleyin, VIP tier ve segment yönetimi yapın.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={segmentFilter}
              onChange={(event) => setSegmentFilter(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            >
              {segmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={tierFilter}
              onChange={(event) => setTierFilter(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            >
              <option value="all">Tüm VIP Seviyeler</option>
              <option value="platinum">Platinum 💎</option>
              <option value="gold">Gold 🥇</option>
              <option value="silver">Silver 🥈</option>
              <option value="bronze">Bronze 🥉</option>
            </select>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-400"
            >
              Yenile
            </button>
            <button
              type="button"
              onClick={handleCalculateAll}
              disabled={isCalculatingAll}
              className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCalculatingAll ? "Hesaplanıyor..." : "Toplu Hesapla"}
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
          <div className="py-8 text-center text-sm text-slate-500">Müşteriler yükleniyor...</div>
        ) : customers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Seçili filtrelere uygun müşteri bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Müşteri</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">E-posta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">VIP Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">İstatistikler</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.uid} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{customer.displayName || "İsimsiz"}</p>
                        {customer.company && <p className="text-xs text-slate-500">{customer.company}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-4 py-3">
                      {customer.vipStatus?.tier ? (
                        getTierBadge(customer.vipStatus.tier)
                      ) : (
                        <span className="text-xs text-slate-400">VIP değil</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {customer.vipStatus?.segment && (
                        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${segmentColors[customer.vipStatus.segment]}`}>
                          {segmentLabels[customer.vipStatus.segment]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {customer.vipStatus?.stats ? (
                        <div className="space-y-1 text-xs">
                          <p>
                            <span className="font-medium">{customer.vipStatus.stats.totalOrdersCount}</span> sipariş
                          </p>
                          <p>
                            <span className="font-medium">{currencyFormatter.format(customer.vipStatus.stats.totalOrdersValue)}</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            %{customer.vipStatus.stats.quoteToOrderConversion.toFixed(1)} dönüşüm
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openCustomerModal(customer)}
                        className="text-sm font-medium text-amber-600 hover:text-amber-700"
                      >
                        Yönet →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Customer Management Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedCustomer.displayName || "Müşteri"}
                </h2>
                <p className="text-sm text-slate-600">{selectedCustomer.email}</p>
                {selectedCustomer.company && <p className="text-sm text-slate-500">{selectedCustomer.company}</p>}
              </div>
              <button
                type="button"
                onClick={closeCustomerModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current VIP Status */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 font-semibold text-slate-900">Mevcut VIP Durumu</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">VIP Tier:</span>
                  <div>{selectedCustomer.vipStatus?.tier ? getTierBadge(selectedCustomer.vipStatus.tier) : <span className="text-sm text-slate-400">VIP değil</span>}</div>
                </div>
                {selectedCustomer.vipStatus?.segment && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Segment:</span>
                    <span className={`rounded-full border px-2 py-1 text-xs font-medium ${segmentColors[selectedCustomer.vipStatus.segment]}`}>
                      {segmentLabels[selectedCustomer.vipStatus.segment]}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">İndirim Oranı:</span>
                  <span className="text-sm font-semibold text-purple-600">%{selectedCustomer.vipStatus?.discount || 0}</span>
                </div>
                {selectedCustomer.vipStatus?.lastCalculatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Son Hesaplama:</span>
                    <span className="text-xs text-slate-500">
                      {(() => {
                        try {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const timestamp = selectedCustomer.vipStatus.lastCalculatedAt as any;
                          const date = typeof timestamp === 'string'
                            ? new Date(timestamp)
                            : timestamp?.toDate?.()
                            ? timestamp.toDate()
                            : new Date(timestamp);
                          return isNaN(date.getTime()) ? '-' : date.toLocaleString("tr-TR");
                        } catch {
                          return '-';
                        }
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            {selectedCustomer.vipStatus?.stats && (
              <div className="mb-6 rounded-lg border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-900">İstatistikler (Son 12 Ay)</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Toplam Sipariş</p>
                    <p className="text-lg font-bold text-slate-900">{selectedCustomer.vipStatus.stats.totalOrdersCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Toplam Ciro</p>
                    <p className="text-lg font-bold text-purple-600">
                      {currencyFormatter.format(selectedCustomer.vipStatus.stats.totalOrdersValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Teklif Sayısı</p>
                    <p className="text-lg font-bold text-slate-900">{selectedCustomer.vipStatus.stats.totalQuotesCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Dönüşüm Oranı</p>
                    <p className="text-lg font-bold text-green-600">
                      %{selectedCustomer.vipStatus.stats.quoteToOrderConversion.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIP Tier Management */}
            <div className="mb-4">
              <h3 className="mb-3 font-semibold text-slate-900">VIP Tier Yönetimi</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(tiers).map(([key, tierInfo]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSetTier(selectedCustomer.uid, tierInfo.name as VIPTier)}
                    disabled={updatingId === selectedCustomer.uid}
                    className={`rounded-lg border-2 p-3 text-left transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${
                      selectedCustomer.vipStatus?.tier === tierInfo.name
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tierInfo.icon}</span>
                      <div>
                        <p className="font-semibold text-slate-900">{tierInfo.label}</p>
                        <p className="text-xs text-slate-600">%{tierInfo.discount} indirim</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSetTier(selectedCustomer.uid, null)}
                  disabled={updatingId === selectedCustomer.uid}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  VIP İptal Et
                </button>
                <button
                  type="button"
                  onClick={() => handleCalculateVIP(selectedCustomer.uid)}
                  disabled={updatingId === selectedCustomer.uid}
                  className="flex-1 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === selectedCustomer.uid ? "Hesaplanıyor..." : "Otomatik Hesapla"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
