"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, PaymentSettings } from "@/lib/settings-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
} from "@/components/admin/settings";

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [formData, setFormData] = useState({
    paytrMerchantId: "",
    paytrMerchantKey: "",
    paytrMerchantSalt: "",
    paytrEnabled: false,
    paytrTestMode: true,
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
      const data = await getSettings<PaymentSettings>("payment");
      setSettings(data);
      setFormData({
        paytrMerchantId: data.paytrMerchantId || "",
        paytrMerchantKey: "", // Never show secret keys
        paytrMerchantSalt: "", // Never show secret keys
        paytrEnabled: data.paytrEnabled ?? false,
        paytrTestMode: (data as PaymentSettings & { paytrTestMode?: boolean }).paytrTestMode ?? true,
      });
    } catch (err) {
      console.error("Failed to load payment settings:", err);
      // If no settings exist, use defaults
      setFormData({
        paytrMerchantId: "",
        paytrMerchantKey: "",
        paytrMerchantSalt: "",
        paytrEnabled: false,
        paytrTestMode: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Only send keys if they were changed
      const dataToSend: Record<string, unknown> = {
        paytrMerchantId: formData.paytrMerchantId,
        paytrEnabled: formData.paytrEnabled,
        paytrTestMode: formData.paytrTestMode,
      };

      if (formData.paytrMerchantKey) {
        dataToSend.paytrMerchantKey = formData.paytrMerchantKey;
      }
      if (formData.paytrMerchantSalt) {
        dataToSend.paytrMerchantSalt = formData.paytrMerchantSalt;
      }

      await updateSettings<PaymentSettings>("payment", dataToSend as Partial<PaymentSettings>);
      setHasChanges(false);
      setSuccessMessage("Ödeme ayarları başarıyla kaydedildi");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save payment settings:", err);
      setError("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        paytrMerchantId: settings.paytrMerchantId || "",
        paytrMerchantKey: "",
        paytrMerchantSalt: "",
        paytrEnabled: settings.paytrEnabled ?? false,
        paytrTestMode: (settings as PaymentSettings & { paytrTestMode?: boolean }).paytrTestMode ?? true,
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
          <p className="text-slate-600">Ödeme ayarları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Ödeme Ayarları</h2>
          <p className="text-sm text-slate-600 mt-1">
            PayTR ödeme entegrasyonunu yapılandırın
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
          title="PayTR Entegrasyonu"
          description="PayTR ödeme sistemine bağlanmak için API bilgilerinizi girin"
        >
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">PayTR Hakkında</p>
                <p>
                  PayTR, Türkiye&apos;de popüler bir ödeme geçididir. API bilgilerinizi{" "}
                  <a
                    href="https://www.paytr.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    PayTR panelinden
                  </a>{" "}
                  alabilirsiniz.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SettingsToggle
              checked={formData.paytrEnabled}
              onChange={(checked) => handleChange("paytrEnabled", checked)}
              label="PayTR Ödemelerini Aktifleştir"
              description="Müşterilerin kredi kartı ile ödeme yapmasına izin ver"
            />

            <SettingsToggle
              checked={formData.paytrTestMode}
              onChange={(checked) => handleChange("paytrTestMode", checked)}
              label="Test Modu"
              description="Gerçek ödeme almadan test işlemleri yapın"
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="API Kimlik Bilgileri"
          description="PayTR hesabınızdan aldığınız API bilgilerini girin"
        >
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Güvenlik Uyarısı</p>
                <p>
                  Merchant Key ve Salt değerleri hassas bilgilerdir. Bu bilgileri kimseyle paylaşmayın.
                  Kaydedilen değerler şifrelenerek saklanır.
                </p>
              </div>
            </div>
          </div>

          <SettingsField
            label="Merchant ID"
            description="PayTR tarafından verilen mağaza numarası"
            required
          >
            <SettingsInput
              type="text"
              value={formData.paytrMerchantId}
              onChange={(e) => handleChange("paytrMerchantId", e.target.value)}
              placeholder="XXXXXX"
            />
          </SettingsField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <SettingsField
              label="Merchant Key"
              description="API erişim anahtarı"
              required
            >
              <SettingsInput
                type="password"
                value={formData.paytrMerchantKey}
                onChange={(e) => handleChange("paytrMerchantKey", e.target.value)}
                placeholder={settings?.paytrMerchantId ? "••••••••••••" : "Merchant Key girin"}
              />
            </SettingsField>

            <SettingsField
              label="Merchant Salt"
              description="Güvenlik tuz değeri"
              required
            >
              <SettingsInput
                type="password"
                value={formData.paytrMerchantSalt}
                onChange={(e) => handleChange("paytrMerchantSalt", e.target.value)}
                placeholder={settings?.paytrMerchantId ? "••••••••••••" : "Merchant Salt girin"}
              />
            </SettingsField>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Ödeme Durumu"
          description="Mevcut ödeme sistemi durumu"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${formData.paytrEnabled ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{formData.paytrEnabled ? "✅" : "⭕"}</span>
                <span className="font-semibold text-slate-900">PayTR</span>
              </div>
              <p className="text-xs text-slate-600">
                {formData.paytrEnabled ? "Aktif" : "Pasif"}
                {formData.paytrEnabled && formData.paytrTestMode && " (Test Modu)"}
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏦</span>
                <span className="font-semibold text-slate-900">Havale/EFT</span>
              </div>
              <p className="text-xs text-slate-600">Her zaman aktif</p>
            </div>

            <div className="p-4 rounded-lg border-2 bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📝</span>
                <span className="font-semibold text-slate-900">Vadeli Ödeme</span>
              </div>
              <p className="text-xs text-slate-600">Teklif onayı ile</p>
            </div>
          </div>
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
