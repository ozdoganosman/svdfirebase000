"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, SiteInfoSettings } from "@/lib/settings-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
} from "@/components/admin/settings";

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteInfoSettings | null>(null);
  const [formData, setFormData] = useState({
    siteName: "",
    siteDescription: "",
    supportEmail: "",
    supportPhone: "",
    maintenanceMode: false,
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
      const data = await getSettings<SiteInfoSettings>("site");
      setSettings(data);
      setFormData({
        siteName: data.siteName || "",
        siteDescription: data.siteDescription || "",
        supportEmail: data.supportEmail || "",
        supportPhone: data.supportPhone || "",
        maintenanceMode: data.maintenanceMode ?? false,
      });
    } catch (err) {
      console.error("Failed to load site settings:", err);
      setError("Site ayarları yüklenirken hata oluştu");
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
      await updateSettings<SiteInfoSettings>("site", formData);
      setHasChanges(false);
      setSuccessMessage("Site ayarları başarıyla kaydedildi");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save site settings:", err);
      setError("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        siteName: settings.siteName || "",
        siteDescription: settings.siteDescription || "",
        supportEmail: settings.supportEmail || "",
        supportPhone: settings.supportPhone || "",
        maintenanceMode: settings.maintenanceMode ?? false,
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
          <h2 className="text-2xl font-bold text-slate-900">Site Ayarları</h2>
          <p className="text-sm text-slate-600 mt-1">
            Sitenizin temel bilgilerini ve yapılandırmasını yönetin
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
          title="Genel Bilgiler"
          description="Sitenizin adı ve açıklaması"
        >
          <SettingsField
            label="Site Adı"
            description="Sitenizin başlık ve branding için kullanılacak adı"
            required
          >
            <SettingsInput
              type="text"
              value={formData.siteName}
              onChange={(e) => handleChange("siteName", e.target.value)}
              placeholder="SVD Ambalaj"
            />
          </SettingsField>

          <SettingsField
            label="Site Açıklaması"
            description="Sitenizin kısa açıklaması (SEO ve meta tags için)"
          >
            <SettingsInput
              type="text"
              value={formData.siteDescription}
              onChange={(e) => handleChange("siteDescription", e.target.value)}
              placeholder="Kaliteli ambalaj ürünleri"
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection
          title="İletişim Bilgileri"
          description="Müşterilerinizin sizinle iletişime geçmesi için bilgiler"
        >
          <SettingsField
            label="Destek E-posta"
            description="Müşteri destek için kullanılacak e-posta adresi"
            required
          >
            <SettingsInput
              type="email"
              value={formData.supportEmail}
              onChange={(e) => handleChange("supportEmail", e.target.value)}
              placeholder="info@svdambalaj.com"
            />
          </SettingsField>

          <SettingsField
            label="Destek Telefon"
            description="Müşteri destek için kullanılacak telefon numarası"
          >
            <SettingsInput
              type="tel"
              value={formData.supportPhone}
              onChange={(e) => handleChange("supportPhone", e.target.value)}
              placeholder="+90 XXX XXX XX XX"
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection
          title="Bakım Modu"
          description="Sitenizi geçici olarak kapatın"
        >
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Dikkat!</p>
                <p className="text-sm text-amber-800 mt-1">
                  Bakım modu aktif olduğunda site ziyaretçilere kapalı olacaktır.
                  Sadece admin kullanıcılar erişebilir.
                </p>
              </div>
            </div>
          </div>

          <SettingsToggle
            checked={formData.maintenanceMode}
            onChange={(checked) => handleChange("maintenanceMode", checked)}
            label="Bakım Modunu Aktifleştir"
            description="Site güncellemeleri veya bakım çalışmaları için siteyi kapatın"
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
