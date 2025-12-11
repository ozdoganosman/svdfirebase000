"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, EmailSettings } from "@/lib/settings-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
  SettingsButton,
} from "@/components/admin/settings";
import { apiFetch } from "@/lib/admin-api";

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [formData, setFormData] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSettings<EmailSettings>("email");
      setSettings(data);
      setFormData({
        smtpHost: data.smtpHost || "",
        smtpPort: data.smtpPort || 587,
        smtpSecure: data.smtpSecure ?? true,
        smtpUser: data.smtpUser || "",
        smtpPassword: "", // Never show password
        fromEmail: data.fromEmail || "",
        fromName: data.fromName || "",
      });
    } catch (err) {
      console.error("Failed to load email settings:", err);
      // If no settings exist, use defaults
      setFormData({
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: true,
        smtpUser: "",
        smtpPassword: "",
        fromEmail: "",
        fromName: "",
      });
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

      // Only send password if it was changed
      const dataToSend = { ...formData };
      if (!dataToSend.smtpPassword) {
        delete (dataToSend as Partial<typeof formData>).smtpPassword;
      }

      await updateSettings<EmailSettings>("email", dataToSend);
      setHasChanges(false);
      setSuccessMessage("E-posta ayarları başarıyla kaydedildi");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save email settings:", err);
      setError("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 587,
        smtpSecure: settings.smtpSecure ?? true,
        smtpUser: settings.smtpUser || "",
        smtpPassword: "",
        fromEmail: settings.fromEmail || "",
        fromName: settings.fromName || "",
      });
    }
    setHasChanges(false);
    setSuccessMessage(null);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setError("Test için bir e-posta adresi girin");
      return;
    }

    try {
      setIsTesting(true);
      setError(null);
      await apiFetch("/admin/email/test", {
        method: "POST",
        body: JSON.stringify({ to: testEmail }),
      });
      setSuccessMessage(`Test e-postası ${testEmail} adresine gönderildi`);
      setTestEmail("");
    } catch (err) {
      console.error("Failed to send test email:", err);
      setError("Test e-postası gönderilemedi. SMTP ayarlarını kontrol edin.");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">E-posta ayarları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">E-posta Ayarları</h2>
          <p className="text-sm text-slate-600 mt-1">
            SMTP sunucu ayarlarını yapılandırın ve e-posta bildirimlerini yönetin
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
          title="SMTP Sunucu Ayarları"
          description="E-posta göndermek için SMTP sunucu bilgilerinizi girin"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsField
              label="SMTP Sunucu"
              description="Örn: smtp.gmail.com"
              required
            >
              <SettingsInput
                type="text"
                value={formData.smtpHost}
                onChange={(e) => handleChange("smtpHost", e.target.value)}
                placeholder="smtp.example.com"
              />
            </SettingsField>

            <SettingsField
              label="Giden Sunucu Portu"
              description="E-posta göndermek için: 587 (TLS, önerilen) veya 465 (SSL)"
              required
            >
              <SettingsInput
                type="number"
                value={formData.smtpPort}
                onChange={(e) => handleChange("smtpPort", Number(e.target.value))}
                placeholder="587"
              />
            </SettingsField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <SettingsField
              label="Kullanıcı Adı"
              description="SMTP kimlik doğrulama için"
              required
            >
              <SettingsInput
                type="text"
                value={formData.smtpUser}
                onChange={(e) => handleChange("smtpUser", e.target.value)}
                placeholder="user@example.com"
              />
            </SettingsField>

            <SettingsField
              label="Şifre"
              description="Güvenlik için şifre gösterilmez"
              required
            >
              <SettingsInput
                type="password"
                value={formData.smtpPassword}
                onChange={(e) => handleChange("smtpPassword", e.target.value)}
                placeholder={settings?.smtpUser ? "••••••••" : "Şifre girin"}
              />
            </SettingsField>
          </div>

          <div className="mt-4">
            <SettingsToggle
              checked={formData.smtpSecure}
              onChange={(checked) => handleChange("smtpSecure", checked)}
              label="Güvenli Bağlantı (TLS/SSL)"
              description="SMTP sunucusuyla şifreli iletişim kullan"
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Gönderici Bilgileri"
          description="E-postalarda görünecek gönderici bilgileri"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsField
              label="Gönderici Adı"
              description="E-postalarda görünecek isim"
              required
            >
              <SettingsInput
                type="text"
                value={formData.fromName}
                onChange={(e) => handleChange("fromName", e.target.value)}
                placeholder="SVD Ambalaj"
              />
            </SettingsField>

            <SettingsField
              label="Gönderici E-posta"
              description="E-postalarda görünecek adres"
              required
            >
              <SettingsInput
                type="email"
                value={formData.fromEmail}
                onChange={(e) => handleChange("fromEmail", e.target.value)}
                placeholder="noreply@svdambalaj.com"
              />
            </SettingsField>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Test E-postası"
          description="Ayarlarınızı test etmek için bir e-posta gönderin"
        >
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Not</p>
                <p>
                  Test e-postası göndermeden önce SMTP ayarlarını kaydetmelisiniz.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <SettingsField label="Test E-posta Adresi">
              <SettingsInput
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </SettingsField>
            <SettingsButton
              onClick={handleTestEmail}
              loading={isTesting}
              variant="secondary"
            >
              Test Gönder
            </SettingsButton>
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
