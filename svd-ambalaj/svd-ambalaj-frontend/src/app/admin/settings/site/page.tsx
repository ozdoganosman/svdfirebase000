"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getSettings, updateSettings, SiteInfoSettings, SocialMediaLinks } from "@/lib/settings-api";
import { uploadMediaFile } from "@/lib/admin-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
} from "@/components/admin/settings";

type FormData = {
  // General
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  // Logo
  logoUrl: string;
  logoAlt: string;
  faviconUrl: string;
  // Address
  address: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  mapUrl: string;
  // Social Media
  socialMedia: SocialMediaLinks;
  // Working Hours
  workingHours: string;
  workingDays: string;
};

const initialFormData: FormData = {
  siteName: "",
  siteDescription: "",
  supportEmail: "",
  supportPhone: "",
  maintenanceMode: false,
  logoUrl: "",
  logoAlt: "",
  faviconUrl: "",
  address: "",
  city: "",
  district: "",
  postalCode: "",
  country: "Türkiye",
  mapUrl: "",
  socialMedia: {
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
    whatsapp: "",
  },
  workingHours: "",
  workingDays: "",
};

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteInfoSettings | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "logo" | "address" | "social" | "hours">("general");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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
        logoUrl: data.logoUrl || "",
        logoAlt: data.logoAlt || "",
        faviconUrl: data.faviconUrl || "",
        address: data.address || "",
        city: data.city || "",
        district: data.district || "",
        postalCode: data.postalCode || "",
        country: data.country || "Türkiye",
        mapUrl: data.mapUrl || "",
        socialMedia: {
          facebook: data.socialMedia?.facebook || "",
          instagram: data.socialMedia?.instagram || "",
          twitter: data.socialMedia?.twitter || "",
          linkedin: data.socialMedia?.linkedin || "",
          youtube: data.socialMedia?.youtube || "",
          tiktok: data.socialMedia?.tiktok || "",
          whatsapp: data.socialMedia?.whatsapp || "",
        },
        workingHours: data.workingHours || "",
        workingDays: data.workingDays || "",
      });
    } catch (err) {
      console.error("Failed to load site settings:", err);
      setError("Site ayarları yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleSocialChange = (platform: keyof SocialMediaLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo dosyası 5MB'den küçük olmalıdır");
      return;
    }

    try {
      setIsUploadingLogo(true);
      setError(null);
      const media = await uploadMediaFile(file);
      handleChange("logoUrl", media.url);
      setSuccessMessage("Logo başarıyla yüklendi");
    } catch (err) {
      console.error("Logo upload error:", err);
      setError("Logo yüklenirken hata oluştu");
    } finally {
      setIsUploadingLogo(false);
      // Reset input
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/") && !file.name.endsWith(".ico")) {
      setError("Lütfen geçerli bir favicon dosyası seçin (ICO, PNG)");
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      setError("Favicon dosyası 1MB'den küçük olmalıdır");
      return;
    }

    try {
      setIsUploadingFavicon(true);
      setError(null);
      const media = await uploadMediaFile(file);
      handleChange("faviconUrl", media.url);
      setSuccessMessage("Favicon başarıyla yüklendi");
    } catch (err) {
      console.error("Favicon upload error:", err);
      setError("Favicon yüklenirken hata oluştu");
    } finally {
      setIsUploadingFavicon(false);
      // Reset input
      if (faviconInputRef.current) {
        faviconInputRef.current.value = "";
      }
    }
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
        logoUrl: settings.logoUrl || "",
        logoAlt: settings.logoAlt || "",
        faviconUrl: settings.faviconUrl || "",
        address: settings.address || "",
        city: settings.city || "",
        district: settings.district || "",
        postalCode: settings.postalCode || "",
        country: settings.country || "Türkiye",
        mapUrl: settings.mapUrl || "",
        socialMedia: {
          facebook: settings.socialMedia?.facebook || "",
          instagram: settings.socialMedia?.instagram || "",
          twitter: settings.socialMedia?.twitter || "",
          linkedin: settings.socialMedia?.linkedin || "",
          youtube: settings.socialMedia?.youtube || "",
          tiktok: settings.socialMedia?.tiktok || "",
          whatsapp: settings.socialMedia?.whatsapp || "",
        },
        workingHours: settings.workingHours || "",
        workingDays: settings.workingDays || "",
      });
    }
    setHasChanges(false);
    setSuccessMessage(null);
  };

  const tabs = [
    { id: "general" as const, label: "Genel", icon: "🏢" },
    { id: "logo" as const, label: "Logo & Marka", icon: "🎨" },
    { id: "address" as const, label: "Adres", icon: "📍" },
    { id: "social" as const, label: "Sosyal Medya", icon: "📱" },
    { id: "hours" as const, label: "Çalışma Saatleri", icon: "🕐" },
  ];

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
            Sitenizin temel bilgilerini, logo, adres ve sosyal medya hesaplarını yönetin
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

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === "general" && (
          <>
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
          </>
        )}

        {/* Logo Tab */}
        {activeTab === "logo" && (
          <SettingsSection
            title="Logo ve Marka"
            description="Sitenizin logosunu ve favicon'unu yönetin"
          >
            <SettingsField
              label="Logo"
              description="Sitenizin ana logosu (önerilen boyut: 200x60 px)"
            >
              {/* Hidden file input */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              {/* Upload button and URL input */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploadingLogo ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Logo Yükle</span>
                    </>
                  )}
                </button>
                <div className="flex-1">
                  <SettingsInput
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => handleChange("logoUrl", e.target.value)}
                    placeholder="veya URL yapıştırın..."
                  />
                </div>
              </div>

              {/* Preview */}
              {formData.logoUrl && (
                <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">Önizleme:</p>
                    <button
                      type="button"
                      onClick={() => handleChange("logoUrl", "")}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Kaldır
                    </button>
                  </div>
                  <div className="relative h-16 w-48">
                    <Image
                      src={formData.logoUrl}
                      alt={formData.logoAlt || "Logo"}
                      fill
                      className="object-contain"
                      onError={() => setError("Logo yüklenemedi")}
                    />
                  </div>
                </div>
              )}
            </SettingsField>

            <SettingsField
              label="Logo Alt Text"
              description="Görme engelli kullanıcılar ve SEO için logo açıklaması"
            >
              <SettingsInput
                type="text"
                value={formData.logoAlt}
                onChange={(e) => handleChange("logoAlt", e.target.value)}
                placeholder="SVD Ambalaj Logo"
              />
            </SettingsField>

            <SettingsField
              label="Favicon"
              description="Tarayıcı sekmesinde görünecek ikon (önerilen: 32x32 px, .ico veya .png)"
            >
              {/* Hidden file input */}
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*,.ico"
                onChange={handleFaviconUpload}
                className="hidden"
              />

              {/* Upload button and URL input */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={isUploadingFavicon}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploadingFavicon ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Favicon Yükle</span>
                    </>
                  )}
                </button>
                <div className="flex-1">
                  <SettingsInput
                    type="url"
                    value={formData.faviconUrl}
                    onChange={(e) => handleChange("faviconUrl", e.target.value)}
                    placeholder="veya URL yapıştırın..."
                  />
                </div>
              </div>

              {/* Preview */}
              {formData.faviconUrl && (
                <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 inline-flex items-center gap-3">
                  <p className="text-xs text-slate-500">Önizleme:</p>
                  <div className="relative h-8 w-8">
                    <Image
                      src={formData.faviconUrl}
                      alt="Favicon"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange("faviconUrl", "")}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Kaldır
                  </button>
                </div>
              )}
            </SettingsField>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-semibold text-green-900">Kolay Yükleme</p>
                  <p className="text-sm text-green-800 mt-1">
                    &quot;Logo Yükle&quot; veya &quot;Favicon Yükle&quot; butonuna tıklayarak
                    bilgisayarınızdan doğrudan görsel seçebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {/* Address Tab */}
        {activeTab === "address" && (
          <SettingsSection
            title="Şirket Adresi"
            description="Fiziksel mağaza veya merkez ofis adresi"
          >
            <SettingsField
              label="Adres"
              description="Sokak/cadde ve numara bilgileri"
            >
              <textarea
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Örnek Caddesi No: 123 Kat: 4"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </SettingsField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsField label="İlçe">
                <SettingsInput
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  placeholder="Kadıköy"
                />
              </SettingsField>

              <SettingsField label="Şehir">
                <SettingsInput
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="İstanbul"
                />
              </SettingsField>

              <SettingsField label="Posta Kodu">
                <SettingsInput
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="34710"
                />
              </SettingsField>

              <SettingsField label="Ülke">
                <SettingsInput
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Türkiye"
                />
              </SettingsField>
            </div>

            <SettingsField
              label="Google Maps Linki"
              description="İletişim sayfasında kullanılacak Google Maps linki"
            >
              <SettingsInput
                type="url"
                value={formData.mapUrl}
                onChange={(e) => handleChange("mapUrl", e.target.value)}
                placeholder="https://maps.app.goo.gl/... veya https://goo.gl/maps/..."
              />
              {formData.mapUrl && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Harita linki kaydedildi:{" "}
                    <a
                      href={formData.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-600"
                    >
                      Haritayı aç
                    </a>
                  </p>
                </div>
              )}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 Google Maps&apos;te konumu bulun → &quot;Paylaş&quot; butonuna tıklayın → &quot;Bağlantı kopyala&quot; seçin
                </p>
              </div>
            </SettingsField>
          </SettingsSection>
        )}

        {/* Social Media Tab */}
        {activeTab === "social" && (
          <SettingsSection
            title="Sosyal Medya Hesapları"
            description="Sosyal medya profillerinize linkler"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsField label="Facebook">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📘</span>
                  <SettingsInput
                    type="url"
                    value={formData.socialMedia.facebook || ""}
                    onChange={(e) => handleSocialChange("facebook", e.target.value)}
                    placeholder="https://facebook.com/svdambalaj"
                  />
                </div>
              </SettingsField>

              <SettingsField label="Instagram">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📷</span>
                  <SettingsInput
                    type="url"
                    value={formData.socialMedia.instagram || ""}
                    onChange={(e) => handleSocialChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/svdambalaj"
                  />
                </div>
              </SettingsField>

              <SettingsField label="Twitter / X">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐦</span>
                  <SettingsInput
                    type="url"
                    value={formData.socialMedia.twitter || ""}
                    onChange={(e) => handleSocialChange("twitter", e.target.value)}
                    placeholder="https://twitter.com/svdambalaj"
                  />
                </div>
              </SettingsField>

              <SettingsField label="LinkedIn">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💼</span>
                  <SettingsInput
                    type="url"
                    value={formData.socialMedia.linkedin || ""}
                    onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/svdambalaj"
                  />
                </div>
              </SettingsField>

              <SettingsField label="YouTube">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📺</span>
                  <SettingsInput
                    type="url"
                    value={formData.socialMedia.youtube || ""}
                    onChange={(e) => handleSocialChange("youtube", e.target.value)}
                    placeholder="https://youtube.com/@svdambalaj"
                  />
                </div>
              </SettingsField>

              <SettingsField label="TikTok">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎵</span>
                  <SettingsInput
                    type="url"
                    value={formData.socialMedia.tiktok || ""}
                    onChange={(e) => handleSocialChange("tiktok", e.target.value)}
                    placeholder="https://tiktok.com/@svdambalaj"
                  />
                </div>
              </SettingsField>

              <SettingsField label="WhatsApp">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <SettingsInput
                    type="tel"
                    value={formData.socialMedia.whatsapp || ""}
                    onChange={(e) => handleSocialChange("whatsapp", e.target.value)}
                    placeholder="+905551234567"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ülke kodu ile birlikte telefon numarası (boşluk ve tire olmadan)
                </p>
              </SettingsField>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mt-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Sosyal Medya Linkleri</p>
                  <p className="text-sm text-indigo-800 mt-1">
                    Bu linkler sitenizin footer bölümünde ve iletişim sayfasında
                    görüntülenecektir. Boş bırakılan alanlar gösterilmeyecektir.
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {/* Working Hours Tab */}
        {activeTab === "hours" && (
          <SettingsSection
            title="Çalışma Saatleri"
            description="Mağaza veya müşteri hizmetleri çalışma zamanları"
          >
            <SettingsField
              label="Çalışma Günleri"
              description="Hangi günler açık olduğunuzu belirtin"
            >
              <SettingsInput
                type="text"
                value={formData.workingDays}
                onChange={(e) => handleChange("workingDays", e.target.value)}
                placeholder="Pazartesi - Cumartesi"
              />
            </SettingsField>

            <SettingsField
              label="Çalışma Saatleri"
              description="Açılış ve kapanış saatleri"
            >
              <SettingsInput
                type="text"
                value={formData.workingHours}
                onChange={(e) => handleChange("workingHours", e.target.value)}
                placeholder="09:00 - 18:00"
              />
            </SettingsField>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Önizleme:</p>
              <div className="flex items-center gap-2 text-slate-600">
                <span>🕐</span>
                <span>
                  {formData.workingDays || "Pazartesi - Cumartesi"},{" "}
                  {formData.workingHours || "09:00 - 18:00"}
                </span>
              </div>
            </div>
          </SettingsSection>
        )}

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
