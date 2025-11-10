"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/admin-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
} from "@/components/admin/settings";

type ComboSettings = {
  id?: string;
  isActive: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number;
  applicableTypes: string[];
  requireSameNeckSize: boolean;
  minQuantity: number;
};

const emptyForm: ComboSettings = {
  isActive: false,
  discountType: "percentage",
  discountValue: 10,
  applicableTypes: ["başlık", "şişe"],
  requireSameNeckSize: true,
  minQuantity: 100,
};

export default function ComboSettingsPage() {
  const [settings, setSettings] = useState<ComboSettings>(emptyForm);
  const [formData, setFormData] = useState<ComboSettings>(emptyForm);
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
      const response = await apiFetch<{ settings: ComboSettings }>("/combo-settings");
      if (response.settings) {
        setSettings(response.settings);
        setFormData(response.settings);
      }
    } catch (err) {
      console.error("Failed to load combo settings:", err);
      setError("Kombo ayarları yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ComboSettings, value: ComboSettings[keyof ComboSettings]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleTypeToggle = (type: string) => {
    setFormData((prev) => {
      const types = prev.applicableTypes.includes(type)
        ? prev.applicableTypes.filter((t) => t !== type)
        : [...prev.applicableTypes, type];
      return { ...prev, applicableTypes: types };
    });
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (formData.discountValue <= 0) {
      setError("İndirim değeri sıfırdan büyük olmalıdır");
      return;
    }

    if (formData.minQuantity < 0) {
      setError("Minimum miktar sıfır veya daha büyük olmalıdır");
      return;
    }

    if (formData.applicableTypes.length < 2) {
      setError("En az iki farklı ürün tipi seçilmelidir");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        isActive: formData.isActive,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        applicableTypes: formData.applicableTypes,
        requireSameNeckSize: formData.requireSameNeckSize,
        minQuantity: Number(formData.minQuantity),
      };

      await apiFetch("/admin/combo-settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setHasChanges(false);
      setSuccessMessage("Kombo ayarları başarıyla güncellendi");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save combo settings:", err);
      setError("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(settings);
    setHasChanges(false);
    setSuccessMessage(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Kombo ayarları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Kombo İndirimleri</h2>
            <p className="text-sm text-slate-600 mt-1">
              Başlık + Şişe kombo indirim ayarlarını yönetin
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${formData.isActive ? "text-green-600" : "text-slate-500"}`}>
              {formData.isActive ? "Aktif" : "Pasif"}
            </span>
            <SettingsToggle
              checked={formData.isActive}
              onChange={(checked) => handleChange("isActive", checked)}
            />
          </div>
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
          title="İndirim Yapılandırması"
          description="İndirim tipini ve miktarını belirleyin"
        >
          <SettingsField
            label="İndirim Tipi"
            description="Yüzde veya sabit tutar olarak indirim uygulayabilirsiniz"
            required
          >
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.discountType === "percentage"}
                  onChange={() => handleChange("discountType", "percentage")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Yüzde (%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.discountType === "fixed"}
                  onChange={() => handleChange("discountType", "fixed")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Sabit Tutar ($)</span>
              </label>
            </div>
          </SettingsField>

          <SettingsField
            label={`İndirim Değeri ${formData.discountType === "percentage" ? "(%)" : "($)"}`}
            description={
              formData.discountType === "percentage"
                ? "Örnek: 10 girdiğinizde %10 indirim uygulanır"
                : "Örnek: 0.02 girdiğinizde her ürün için $0.02 indirim uygulanır"
            }
            required
          >
            <SettingsInput
              type="number"
              value={formData.discountValue}
              onChange={(e) => handleChange("discountValue", Number(e.target.value))}
              step={formData.discountType === "percentage" ? "1" : "0.01"}
              min="0"
              placeholder={formData.discountType === "percentage" ? "10" : "0.02"}
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection
          title="Uygulama Koşulları"
          description="Kombo indiriminin ne zaman uygulanacağını belirleyin"
        >
          <SettingsField
            label="Minimum Kombo Miktarı"
            description="Kombo indiriminin uygulanması için gereken minimum ürün adedi"
            required
          >
            <SettingsInput
              type="number"
              value={formData.minQuantity}
              onChange={(e) => handleChange("minQuantity", Number(e.target.value))}
              min="0"
              step="1"
              placeholder="100"
            />
          </SettingsField>

          <SettingsField
            label="Uygulanabilir Ürün Tipleri"
            description="En az iki farklı tip seçilmelidir"
            required
          >
            <div className="flex gap-4">
              {["başlık", "şişe", "nötr"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.applicableTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  <span className="text-sm text-slate-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </SettingsField>

          <SettingsToggle
            checked={formData.requireSameNeckSize}
            onChange={(checked) => handleChange("requireSameNeckSize", checked)}
            label="Aynı Ağız Ölçüsü Gerekli"
            description="Eğer aktifse, sadece aynı ağız ölçüsüne sahip ürünler için kombo uygulanır"
          />
        </SettingsSection>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Kombo İndirimi Nasıl Çalışır?
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>Müşteri farklı tiplerde ürünler aldığında (örn: başlık + şişe)</li>
                <li>Eşleşen minimum miktar kadar ürüne indirim uygulanır</li>
                <li>Örnek: 4500 başlık + 3000 şişe → 3000 adede kombo indirim</li>
                <li>İndirim otomatik olarak sepet ve checkout sayfalarında gösterilir</li>
                <li>En ucuz ürünler öncelikli olarak eşleştirilir (cheapest-first)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <SettingsSaveBar
        show={hasChanges}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={isSaving}
      />
    </>
  );
}
