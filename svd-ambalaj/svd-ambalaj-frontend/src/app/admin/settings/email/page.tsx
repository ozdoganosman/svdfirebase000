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

type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  isCustom?: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

type TabType = "smtp" | "templates";

const TEMPLATE_INFO: Record<string, { name: string; description: string; variables: string[] }> = {
  // Sipariş E-postaları
  orderConfirmation: {
    name: "Sipariş Onayı",
    description: "Sipariş oluşturulduğunda müşteriye gönderilen e-posta",
    variables: ["customerName", "orderNumber", "createdAtFormatted", "statusText", "itemsFormatted", "subtotalFormatted", "discountFormatted", "taxFormatted", "totalFormatted", "deliveryAddress", "deliveryCity", "notes", "ordersUrl"],
  },
  orderStatus: {
    name: "Sipariş Durumu",
    description: "Sipariş durumu değiştiğinde müşteriye gönderilen e-posta",
    variables: ["customerName", "orderNumber", "status", "statusText", "statusEmoji", "statusMessage", "updatedAtFormatted", "trackingNumber", "trackingUrl", "adminNotes", "ordersUrl"],
  },
  // Kullanıcı E-postaları
  welcome: {
    name: "Hoş Geldin",
    description: "Yeni kullanıcı kaydolduğunda gönderilen e-posta",
    variables: ["userName", "userEmail", "siteName", "siteUrl", "currentYear"],
  },
  // Teklif E-postaları
  quoteApproved: {
    name: "Teklif Onaylandı",
    description: "Müşteriye teklifi onaylandığında gönderilen e-posta",
    variables: ["customerName", "quoteNumber", "totalFormatted", "createdAtFormatted", "validUntilFormatted", "adminNotes", "quotesUrl"],
  },
  quoteRejected: {
    name: "Teklif Reddedildi",
    description: "Müşteriye teklifi reddedildiğinde gönderilen e-posta",
    variables: ["customerName", "quoteNumber", "createdAtFormatted", "adminNotes"],
  },
  // Numune E-postaları
  sampleApproved: {
    name: "Numune Onaylandı",
    description: "Müşteriye numune talebi onaylandığında gönderilen e-posta",
    variables: ["customerName", "sampleNumber", "createdAtFormatted", "shippingFeeFormatted", "items"],
  },
  // Admin E-postaları
  newQuoteAdmin: {
    name: "Yeni Teklif (Admin)",
    description: "Yeni teklif talebi geldiğinde admin'e gönderilen e-posta",
    variables: ["customerName", "customerCompany", "customerEmail", "customerPhone", "quoteNumber", "totalFormatted", "adminQuotesUrl"],
  },
  newSampleAdmin: {
    name: "Yeni Numune (Admin)",
    description: "Yeni numune talebi geldiğinde admin'e gönderilen e-posta",
    variables: ["customerName", "customerCompany", "customerEmail", "customerPhone", "sampleNumber", "shippingFeeFormatted", "notes", "adminSamplesUrl"],
  },
  newOrderAdmin: {
    name: "Yeni Sipariş (Admin)",
    description: "Yeni sipariş oluşturulduğunda admin'e gönderilen e-posta",
    variables: ["customerName", "customerCompany", "customerEmail", "customerPhone", "orderNumber", "totalFormatted", "itemsFormatted", "adminOrdersUrl"],
  },
  stockAlert: {
    name: "Stok Uyarısı (Admin)",
    description: "Stok seviyesi düşük olduğunda admin'e gönderilen e-posta",
    variables: ["outOfStockCount", "criticalCount", "lowCount", "totalAlerts", "outOfStock", "critical", "low", "alertEmoji", "alertTitle", "adminProductsUrl"],
  },
};

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("smtp");
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

  // Template states
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isResettingTemplate, setIsResettingTemplate] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    subject: "",
    htmlTemplate: "",
    textTemplate: "",
  });
  const [hasTemplateChanges, setHasTemplateChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "templates" && templates.length === 0) {
      loadTemplates();
    }
  }, [activeTab, templates.length]);

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

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      setError(null);
      const response = await apiFetch<{ templates: Record<string, EmailTemplate> }>("/admin/email/templates");
      const templatesArray = Object.entries(response.templates).map(([id, template]) => ({
        ...template,
        id,
        name: TEMPLATE_INFO[id]?.name || id,
        description: TEMPLATE_INFO[id]?.description || "",
      }));
      setTemplates(templatesArray);
    } catch (err) {
      console.error("Failed to load email templates:", err);
      setError("E-posta şablonları yüklenirken hata oluştu");
    } finally {
      setIsLoadingTemplates(false);
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

  // Template handlers
  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      subject: template.subject,
      htmlTemplate: template.htmlTemplate,
      textTemplate: template.textTemplate,
    });
    setHasTemplateChanges(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleTemplateChange = (field: keyof typeof templateFormData, value: string) => {
    setTemplateFormData((prev) => ({ ...prev, [field]: value }));
    setHasTemplateChanges(true);
    setSuccessMessage(null);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setIsSavingTemplate(true);
      setError(null);
      await apiFetch(`/admin/email/templates/${selectedTemplate.id}`, {
        method: "PUT",
        body: JSON.stringify(templateFormData),
      });
      setSuccessMessage("Şablon başarıyla kaydedildi");
      setHasTemplateChanges(false);
      await loadTemplates();
      // Refresh selected template
      const updatedTemplate = templates.find((t) => t.id === selectedTemplate.id);
      if (updatedTemplate) {
        setSelectedTemplate({ ...updatedTemplate, ...templateFormData });
      }
    } catch (err) {
      console.error("Failed to save template:", err);
      setError("Şablon kaydedilirken hata oluştu");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleResetTemplate = async () => {
    if (!selectedTemplate) return;
    if (!confirm("Şablonu varsayılana sıfırlamak istediğinize emin misiniz?")) return;

    try {
      setIsResettingTemplate(true);
      setError(null);
      const response = await apiFetch<{ template: EmailTemplate }>(`/admin/email/templates/${selectedTemplate.id}/reset`, {
        method: "POST",
      });
      setSuccessMessage("Şablon varsayılana sıfırlandı");
      setHasTemplateChanges(false);
      await loadTemplates();
      // Update form with default values
      setTemplateFormData({
        subject: response.template.subject,
        htmlTemplate: response.template.htmlTemplate,
        textTemplate: response.template.textTemplate,
      });
      setSelectedTemplate({ ...selectedTemplate, ...response.template, isCustom: false });
    } catch (err) {
      console.error("Failed to reset template:", err);
      setError("Şablon sıfırlanırken hata oluştu");
    } finally {
      setIsResettingTemplate(false);
    }
  };

  const handleCancelTemplateChanges = () => {
    if (selectedTemplate) {
      setTemplateFormData({
        subject: selectedTemplate.subject,
        htmlTemplate: selectedTemplate.htmlTemplate,
        textTemplate: selectedTemplate.textTemplate,
      });
    }
    setHasTemplateChanges(false);
    setSuccessMessage(null);
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
      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("smtp")}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "smtp"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            SMTP Ayarları
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "templates"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            E-posta Şablonları
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">X</span>
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
              <span className="text-2xl">OK</span>
              <div>
                <p className="text-sm font-medium text-green-900">Basarili</p>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* SMTP Tab */}
        {activeTab === "smtp" && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">SMTP Ayarlari</h2>
              <p className="text-sm text-slate-600 mt-1">
                SMTP sunucu ayarlarini yapilandirin ve e-posta bildirimlerini yonetin
              </p>
            </div>

            <SettingsSection
              title="SMTP Sunucu Ayarlari"
              description="E-posta gondermek icin SMTP sunucu bilgilerinizi girin"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsField
                  label="SMTP Sunucu"
                  description="Orn: smtp.gmail.com"
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
                  description="E-posta gondermek icin: 587 (TLS, onerilen) veya 465 (SSL)"
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
                  label="Kullanici Adi"
                  description="SMTP kimlik dogrulama icin"
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
                  label="Sifre"
                  description="Guvenlik icin sifre gosterilmez"
                  required
                >
                  <SettingsInput
                    type="password"
                    value={formData.smtpPassword}
                    onChange={(e) => handleChange("smtpPassword", e.target.value)}
                    placeholder={settings?.smtpUser ? "********" : "Sifre girin"}
                  />
                </SettingsField>
              </div>

              <div className="mt-4">
                <SettingsToggle
                  checked={formData.smtpSecure}
                  onChange={(checked) => handleChange("smtpSecure", checked)}
                  label="Guvenli Baglanti (TLS/SSL)"
                  description="SMTP sunucusuyla sifreli iletisim kullan"
                />
              </div>
            </SettingsSection>

            <SettingsSection
              title="Gonderici Bilgileri"
              description="E-postalarda gorunecek gonderici bilgileri"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsField
                  label="Gonderici Adi"
                  description="E-postalarda gorunecek isim"
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
                  label="Gonderici E-posta"
                  description="E-postalarda gorunecek adres"
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
              title="Test E-postasi"
              description="Ayarlarinizi test etmek icin bir e-posta gonderin"
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">i</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Not</p>
                    <p>
                      Test e-postasi gondermeden once SMTP ayarlarini kaydetmelisiniz.
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
                  Test Gonder
                </SettingsButton>
              </div>
            </SettingsSection>

            {settings && (
              <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Son Guncelleme</h4>
                <div className="text-xs text-slate-600 space-y-1">
                  {settings.updatedAt && (
                    <p>Tarih: {new Date(settings.updatedAt).toLocaleString("tr-TR")}</p>
                  )}
                  {settings.updatedBy && <p>Guncelleyen: {settings.updatedBy}</p>}
                </div>
              </div>
            )}
          </>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">E-posta Sablonlari</h2>
              <p className="text-sm text-slate-600 mt-1">
                Sistem tarafindan gonderilen e-postalarin icerigini ozellestirin
              </p>
            </div>

            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template List */}
                <div className="lg:col-span-1">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700">Sablonlar</h3>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            selectedTemplate?.id === template.id
                              ? "bg-indigo-50 border-l-4 border-indigo-600"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-slate-900">{template.name}</span>
                            {template.isCustom && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                Ozel
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Template Editor */}
                <div className="lg:col-span-2">
                  {selectedTemplate ? (
                    <div className="border border-slate-200 rounded-lg">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700">
                            {selectedTemplate.name}
                          </h3>
                          <p className="text-xs text-slate-500">{selectedTemplate.description}</p>
                        </div>
                        {selectedTemplate.isCustom && (
                          <button
                            onClick={handleResetTemplate}
                            disabled={isResettingTemplate}
                            className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            {isResettingTemplate ? "Sifirlaniyor..." : "Varsayilana Sifirla"}
                          </button>
                        )}
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Available Variables Info */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-semibold text-blue-800 mb-2">Kullanilabilir Degiskenler:</p>
                          <div className="flex flex-wrap gap-1">
                            {TEMPLATE_INFO[selectedTemplate.id]?.variables.map((variable) => (
                              <code
                                key={variable}
                                className="text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-700"
                              >
                                {`{{${variable}}}`}
                              </code>
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 mt-2">
                            Donguler icin: {`{{#each items}}...{{/each}}`}, Kosullar icin: {`{{#if variable}}...{{/if}}`}
                          </p>
                        </div>

                        {/* Subject */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Konu
                          </label>
                          <input
                            type="text"
                            value={templateFormData.subject}
                            onChange={(e) => handleTemplateChange("subject", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* HTML Template */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            HTML Sablonu
                          </label>
                          <textarea
                            value={templateFormData.htmlTemplate}
                            onChange={(e) => handleTemplateChange("htmlTemplate", e.target.value)}
                            rows={12}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* Text Template */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Duz Metin Sablonu
                          </label>
                          <textarea
                            value={templateFormData.textTemplate}
                            onChange={(e) => handleTemplateChange("textTemplate", e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        {/* Template Info */}
                        {selectedTemplate.updatedAt && (
                          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                            Son guncelleme: {new Date(selectedTemplate.updatedAt).toLocaleString("tr-TR")}
                            {selectedTemplate.updatedBy && ` - ${selectedTemplate.updatedBy}`}
                          </div>
                        )}
                      </div>

                      {/* Template Save Bar */}
                      {hasTemplateChanges && (
                        <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-end gap-3">
                          <button
                            onClick={handleCancelTemplateChanges}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                          >
                            Iptal
                          </button>
                          <button
                            onClick={handleSaveTemplate}
                            disabled={isSavingTemplate}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                          >
                            {isSavingTemplate ? "Kaydediliyor..." : "Sablonu Kaydet"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg p-8 text-center">
                      <div className="text-4xl mb-3">E</div>
                      <p className="text-slate-600">Duzenlemek icin bir sablon secin</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {activeTab === "smtp" && (
        <SettingsSaveBar
          show={hasChanges}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={isSaving}
        />
      )}
    </div>
  );
}
