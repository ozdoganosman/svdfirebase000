"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/admin-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsButton,
} from "@/components/admin/settings";

type FirestoreTimestamp = {
  _seconds: number;
  _nanoseconds: number;
};

type ExchangeRate = {
  currency: string;
  rate: number;
  effectiveDate: string;
  source: string;
  lastUpdated: FirestoreTimestamp | string;
  isActive: boolean;
};

type HistoryEntry = {
  id: string;
  rate: number;
  effectiveDate: string;
  source: string;
  savedAt: string;
};

// Helper function to parse Firestore timestamps
const parseTimestamp = (timestamp: FirestoreTimestamp | string | undefined | null): Date | null => {
  if (!timestamp) return null;
  if (typeof timestamp === "object" && "_seconds" in timestamp) {
    return new Date(timestamp._seconds * 1000);
  }
  return new Date(timestamp);
};

export default function ExchangeRatesPage() {
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [manualRate, setManualRate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentRate();
  }, []);

  const loadCurrentRate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiFetch<{ exchangeRate: ExchangeRate }>("/exchange-rate");
      setCurrentRate(response.exchangeRate);
      setManualRate(response.exchangeRate?.rate?.toFixed(4) || "");
    } catch (err) {
      console.error("Failed to load exchange rate:", err);
      setError("Döviz kuru yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await apiFetch<{ history: HistoryEntry[] }>("/exchange-rate/history");
      setHistory(response.history || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAutoUpdate = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccessMessage(null);
      await apiFetch("/exchange-rate/update", { method: "POST" });
      setSuccessMessage("Döviz kuru TCMB&apos;den başarıyla güncellendi");
      await loadCurrentRate();
    } catch (err) {
      console.error("Failed to update exchange rate:", err);
      setError("Döviz kuru güncellenirken hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualUpdate = async () => {
    const rate = parseFloat(manualRate);
    if (isNaN(rate) || rate <= 0) {
      setError("Geçerli bir kur değeri girin");
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setSuccessMessage(null);

      // Manual update - we'll need to add this endpoint
      await apiFetch("/admin/exchange-rate/manual", {
        method: "POST",
        body: JSON.stringify({ rate }),
      });

      setSuccessMessage("Döviz kuru manuel olarak güncellendi");
      await loadCurrentRate();
    } catch (err) {
      console.error("Failed to manually update exchange rate:", err);
      setError("Döviz kuru güncellenirken hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Döviz kuru yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Döviz Kurları</h2>
        <p className="text-sm text-slate-600 mt-1">
          USD/TRY döviz kurunu yönetin ve geçmiş kurları görüntüleyin
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="text-sm font-medium text-red-900">Hata</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-medium text-green-900">Başarılı</p>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {currentRate && (
        <SettingsSection
          title="Güncel Kur"
          description="Şu anda kullanılan USD/TRY döviz kuru"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border-2 border-indigo-200">
              <p className="text-sm font-medium text-indigo-700 mb-1">Mevcut Kur</p>
              <p className="text-3xl font-bold text-indigo-900 break-words">
                ₺{currentRate?.rate?.toFixed(4) || "-"}
              </p>
              <p className="text-xs text-indigo-600 mt-2 break-words">
                1 USD = {currentRate?.rate?.toFixed(4) || "-"} TRY
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Kaynak</p>
              <p className="text-lg font-semibold text-slate-900">{currentRate?.source || "-"}</p>
              <p className="text-xs text-slate-600 mt-2">Veri kaynağı</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-1">Son Güncelleme</p>
              <p className="text-lg font-semibold text-slate-900">
                {parseTimestamp(currentRate?.lastUpdated)?.toLocaleDateString("tr-TR") || "-"}
              </p>
              <p className="text-xs text-slate-600 mt-2">
                {parseTimestamp(currentRate?.lastUpdated)?.toLocaleTimeString("tr-TR") || "-"}
              </p>
            </div>
          </div>
        </SettingsSection>
      )}

      <SettingsSection
        title="Otomatik Güncelleme"
        description="TCMB&apos;den güncel döviz kurunu çekin"
      >
        <div className="flex items-center gap-4">
          <SettingsButton onClick={handleAutoUpdate} loading={isUpdating}>
            TCMB&apos;den Kur Çek
          </SettingsButton>
          <p className="text-sm text-slate-600">
            Türkiye Cumhuriyet Merkez Bankası&apos;ndan güncel USD/TRY kurunu alır
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Manuel Güncelleme"
        description="Döviz kurunu manuel olarak girin"
      >
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-900">Dikkat!</p>
              <p className="text-sm text-amber-800 mt-1">
                Manuel olarak girilen kur tüm fiyatlandırmaları etkileyecektir.
                Yalnızca gerekli durumlarda kullanın.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <SettingsField label="USD/TRY Kuru" required>
            <SettingsInput
              type="number"
              step="0.0001"
              min="0"
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
              placeholder="41.9677"
            />
          </SettingsField>
          <SettingsButton
            onClick={handleManualUpdate}
            loading={isUpdating}
            variant="secondary"
          >
            Manuel Güncelle
          </SettingsButton>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Kur Geçmişi"
        description="Geçmiş döviz kuru değişiklikleri"
        action={
          <SettingsButton
            onClick={loadHistory}
            loading={isLoadingHistory}
            variant="secondary"
          >
            Geçmişi Yükle
          </SettingsButton>
        }
      >
        {history.length === 0 ? (
          <p className="text-sm text-slate-600">
            Geçmiş kurları görüntülemek için &ldquo;Geçmişi Yükle&rdquo; butonuna tıklayın
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Tarih
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Kur
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Kaynak
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Kaydedilme
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {new Date(entry.effectiveDate).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      ₺{entry.rate.toFixed(4)}
                    </td>
                    <td className="py-3 px-4">{entry.source}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(entry.savedAt).toLocaleString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSection>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">Bilgi</p>
            <p className="text-sm text-blue-800 mt-1">
              Döviz kuru otomatik olarak günde 2 kez (sabah 09:00 ve akşam 18:00)
              TCMB&apos;den güncellenmektedir. İsterseniz manuel olarak da güncelleyebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
