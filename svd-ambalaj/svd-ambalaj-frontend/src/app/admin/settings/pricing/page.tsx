"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, PricingSettings } from "@/lib/settings-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
} from "@/components/admin/settings";

export default function PricingSettingsPage() {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [formData, setFormData] = useState({
    currency: "TRY",
    taxRate: 20,
    allowGuestCheckout: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSettings<PricingSettings>("pricing");
      setSettings(data);
      setFormData({
        currency: data.currency || "TRY",
        taxRate: data.taxRate || 20,
        allowGuestCheckout: data.allowGuestCheckout ?? false,
      });
    } catch (err) {
      console.error("Failed to load pricing settings:", err);
      setError("Fiyatlandırma ayarları yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await updateSettings<PricingSettings>("pricing", formData);
      setHasChanges(false);
      setSuccessMessage("Fiyatlandırma ayarları başarıyla kaydedildi");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save pricing settings:", err);
      setError("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        currency: settings.currency || "TRY",
        taxRate: settings.taxRate || 20,
        allowGuestCheckout: settings.allowGuestCheckout ?? false,
      });
    }
    setHasChanges(false);
    setSuccessMessage(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">💰 Fiyatlandırma Ayarları</h2>
          <p className="text-sm text-slate-600 mt-1">
            Para birimi, vergi oranı ve fiyat gösterim ayarlarını yönetin
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

        <SettingsSection
          title="Temel Ayarlar"
          description="Sitenizin ana fiyatlandırma yapılandırması"
        >
          <SettingsField
            label="Para Birimi"
            description="Sitenizde kullanılacak ana para birimi"
            required
          >
            <select
              value={formData.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="TRY">TRY (Türk Lirası)</option>
              <option value="USD">USD (Amerikan Doları)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </SettingsField>

          <SettingsField
            label="KDV Oranı (%)"
            description="Fiyatlara uygulanacak vergi oranı"
            required
          >
            <SettingsInput
              type="number"
              min="0"
              max="100"
              step="1"
              value={formData.taxRate}
              onChange={(e) => handleChange("taxRate", Number(e.target.value))}
              placeholder="20"
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection
          title="Sipariş Ayarları"
          description="Sipariş verme süreciyle ilgili ayarlar"
        >
          <SettingsToggle
            checked={formData.allowGuestCheckout}
            onChange={(checked) => handleChange("allowGuestCheckout", checked)}
            label="Misafir Olarak Sipariş Vermeye İzin Ver"
            description="Aktif olduğunda üye olmadan sipariş verilebilir"
          />
        </SettingsSection>

        {settings && (
          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Son Güncelleme</h4>
            <div className="text-xs text-slate-600 space-y-1">
              {settings.updatedAt && (
                <p>Tarih: {new Date(settings.updatedAt).toLocaleString("tr-TR")}</p>
              )}
              {settings.updatedBy && <p>Güncelleyen: {settings.updatedBy}</p>}
            </div>
          </div>
        )}
      </div>

      <SettingsSaveBar
        show={hasChanges}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={isSaving}
      />
    </div>
  );
}
