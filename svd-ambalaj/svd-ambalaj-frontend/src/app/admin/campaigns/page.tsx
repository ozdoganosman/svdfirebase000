"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/admin-api";
import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  type: "discount" | "free_shipping" | "bundle";
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  priority: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiFetch<{ campaigns: Campaign[] }>("/admin/campaigns");
      setCampaigns(response.campaigns || []);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
      setError("Kampanyalar yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kampanyayı silmek istediğinizden emin misiniz?")) return;

    try {
      setDeletingId(id);
      await apiFetch(`/admin/campaigns/${id}`, { method: "DELETE" });
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      setError("Kampanya silinirken hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (campaign: Campaign) => {
    try {
      await apiFetch(`/admin/campaigns/${campaign.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !campaign.isActive }),
      });
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaign.id ? { ...c, isActive: !c.isActive } : c
        )
      );
    } catch (err) {
      console.error("Failed to toggle campaign:", err);
      setError("Kampanya durumu değiştirilirken hata oluştu");
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === "active") return c.isActive;
    if (filter === "inactive") return !c.isActive;
    return true;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "discount":
        return "İndirim";
      case "free_shipping":
        return "Ücretsiz Kargo";
      case "bundle":
        return "Paket";
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "discount":
        return "bg-blue-100 text-blue-800";
      case "free_shipping":
        return "bg-green-100 text-green-800";
      case "bundle":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const isCampaignExpired = (campaign: Campaign) => {
    if (!campaign.endDate) return false;
    return new Date(campaign.endDate) < new Date();
  };

  const isCampaignUpcoming = (campaign: Campaign) => {
    if (!campaign.startDate) return false;
    return new Date(campaign.startDate) > new Date();
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Kampanyalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kampanya Yönetimi</h1>
          <p className="text-sm text-slate-600 mt-1">
            Promosyonları ve kampanyaları yönetin
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <span className="text-lg">+</span>
          Yeni Kampanya
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#x274C;</span>
            <div>
              <p className="text-sm font-medium text-red-900">Hata</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">Filtre:</span>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "Tümü" : f === "active" ? "Aktif" : "Pasif"}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-500 ml-auto">
          {filteredCampaigns.length} kampanya
        </span>
      </div>

      {/* Campaigns List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">&#x1F3F7;</div>
            <p className="text-slate-600 mb-4">Henüz kampanya bulunmuyor</p>
            <Link
              href="/admin/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              İlk kampanyayı oluştur
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Kampanya
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Tip
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  İndirim
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Tarih Aralığı
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Kullanım
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Durum
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{campaign.name}</p>
                      {campaign.description && (
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(
                        campaign.type
                      )}`}
                    >
                      {getTypeLabel(campaign.type)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium text-slate-900">
                      {campaign.discountType === "percentage"
                        ? `%${campaign.discountValue}`
                        : `${campaign.discountValue} TL`}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p className="text-slate-700">
                        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                      </p>
                      {isCampaignExpired(campaign) && (
                        <span className="text-xs text-red-600 font-medium">Süresi doldu</span>
                      )}
                      {isCampaignUpcoming(campaign) && (
                        <span className="text-xs text-blue-600 font-medium">Yakında başlayacak</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-700">
                      {campaign.usedCount}
                      {campaign.maxUses > 0 && ` / ${campaign.maxUses}`}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(campaign)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                        campaign.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          campaign.isActive ? "bg-green-500" : "bg-slate-400"
                        }`}
                      />
                      {campaign.isActive ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Düzenle"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        disabled={deletingId === campaign.id}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Sil"
                      >
                        {deletingId === campaign.id ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">&#x2139;&#xFE0F;</span>
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Kampanya Tipleri
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>
                <strong>İndirim:</strong> Sepet toplamından yüzde veya sabit tutar indirim
              </li>
              <li>
                <strong>Ücretsiz Kargo:</strong> Belirlenen koşullarda ücretsiz kargo
              </li>
              <li>
                <strong>Paket:</strong> Belirli ürünlerin birlikte alınmasında özel fiyat
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
