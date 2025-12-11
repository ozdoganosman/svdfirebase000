"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/admin-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
} from "@/components/admin/settings";
import Link from "next/link";

type Campaign = {
  id?: string;
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
  applicableProducts: string[];
  applicableCategories: string[];
};

const emptyForm: Campaign = {
  name: "",
  type: "discount",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  startDate: null,
  endDate: null,
  isActive: false,
  priority: 0,
  minOrderValue: 0,
  maxUses: 0,
  applicableProducts: [],
  applicableCategories: [],
};

export default function CampaignEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === "new";
  const router = useRouter();

  const [formData, setFormData] = useState<Campaign>(emptyForm);
  const [originalData, setOriginalData] = useState<Campaign>(emptyForm);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew) {
      loadCampaign();
    }
  }, [isNew, resolvedParams.id]);

  const loadCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiFetch<{ campaign: Campaign }>(
        `/admin/campaigns/${resolvedParams.id}`
      );
      if (response.campaign) {
        const campaign = {
          ...response.campaign,
          startDate: response.campaign.startDate
            ? response.campaign.startDate.split("T")[0]
            : null,
          endDate: response.campaign.endDate
            ? response.campaign.endDate.split("T")[0]
            : null,
        };
        setFormData(campaign);
        setOriginalData(campaign);
      }
    } catch (err) {
      console.error("Failed to load campaign:", err);
      setError("Kampanya yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof Campaign, value: Campaign[keyof Campaign]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError("Kampanya adı zorunludur");
      return;
    }

    if (formData.discountValue <= 0) {
      setError("İndirim değeri sıfırdan büyük olmalıdır");
      return;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        setError("Başlangıç tarihi bitiş tarihinden sonra olamaz");
        return;
      }
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        isActive: formData.isActive,
        priority: Number(formData.priority),
        minOrderValue: Number(formData.minOrderValue),
        maxUses: Number(formData.maxUses),
        applicableProducts: formData.applicableProducts,
        applicableCategories: formData.applicableCategories,
      };

      if (isNew) {
        await apiFetch("/admin/campaigns", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/admin/campaigns/${resolvedParams.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      router.push("/admin/campaigns");
    } catch (err) {
      console.error("Failed to save campaign:", err);
      setError("Kampanya kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("Kaydedilmemiş değişiklikler var. Devam etmek istiyor musunuz?")) {
        router.push("/admin/campaigns");
      }
    } else {
      router.push("/admin/campaigns");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Kampanya yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/campaigns"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isNew ? "Yeni Kampanya" : "Kampanya Düzenle"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isNew ? "Yeni bir kampanya oluşturun" : `${originalData.name} kampanyasını düzenleyin`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">&#x274C;</span>
                <div>
                  <p className="text-sm font-medium text-red-900">Hata</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <SettingsSection
            title="Temel Bilgiler"
            description="Kampanyanın adını ve açıklamasını girin"
          >
            <SettingsField label="Kampanya Adı" required>
              <SettingsInput
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Örn: Yaz İndirimi 2024"
              />
            </SettingsField>

            <SettingsField label="Açıklama">
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Kampanya detayları..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                rows={3}
              />
            </SettingsField>

            <SettingsField label="Kampanya Tipi" required>
              <div className="flex gap-4">
                {[
                  { value: "discount", label: "İndirim" },
                  { value: "free_shipping", label: "Ücretsiz Kargo" },
                  { value: "bundle", label: "Paket" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.type === option.value}
                      onChange={() => handleChange("type", option.value as Campaign["type"])}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </SettingsField>
          </SettingsSection>

          <SettingsSection
            title="İndirim Ayarları"
            description="İndirim tipini ve miktarını belirleyin"
          >
            <SettingsField label="İndirim Tipi" required>
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
                  <span className="text-sm text-slate-700">Sabit Tutar (TL)</span>
                </label>
              </div>
            </SettingsField>

            <SettingsField
              label={`İndirim Değeri ${formData.discountType === "percentage" ? "(%)" : "(TL)"}`}
              required
            >
              <SettingsInput
                type="number"
                value={formData.discountValue}
                onChange={(e) => handleChange("discountValue", Number(e.target.value))}
                step={formData.discountType === "percentage" ? "1" : "0.01"}
                min="0"
                placeholder={formData.discountType === "percentage" ? "10" : "50"}
              />
            </SettingsField>

            <SettingsField
              label="Minimum Sipariş Tutarı (TL)"
              description="0 ise minimum tutar zorunluluğu yoktur"
            >
              <SettingsInput
                type="number"
                value={formData.minOrderValue}
                onChange={(e) => handleChange("minOrderValue", Number(e.target.value))}
                min="0"
                placeholder="0"
              />
            </SettingsField>
          </SettingsSection>

          <SettingsSection
            title="Geçerlilik Süresi"
            description="Kampanyanın aktif olacağı tarih aralığını belirleyin"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsField label="Başlangıç Tarihi">
                <SettingsInput
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) => handleChange("startDate", e.target.value || null)}
                />
              </SettingsField>

              <SettingsField label="Bitiş Tarihi">
                <SettingsInput
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) => handleChange("endDate", e.target.value || null)}
                />
              </SettingsField>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                {!formData.startDate && !formData.endDate
                  ? "Tarih belirtilmezse kampanya süresiz olarak geçerli olur"
                  : formData.startDate && !formData.endDate
                  ? `${new Date(formData.startDate).toLocaleDateString("tr-TR")} tarihinden itibaren süresiz geçerli`
                  : !formData.startDate && formData.endDate
                  ? `${new Date(formData.endDate).toLocaleDateString("tr-TR")} tarihine kadar geçerli`
                  : `${new Date(formData.startDate!).toLocaleDateString("tr-TR")} - ${new Date(formData.endDate!).toLocaleDateString("tr-TR")} tarihleri arasında geçerli`}
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Kullanım Limitleri"
            description="Kampanyanın kullanım sınırlarını belirleyin"
          >
            <SettingsField
              label="Maksimum Kullanım Sayısı"
              description="0 ise sınırsız kullanım"
            >
              <SettingsInput
                type="number"
                value={formData.maxUses}
                onChange={(e) => handleChange("maxUses", Number(e.target.value))}
                min="0"
                placeholder="0"
              />
            </SettingsField>

            <SettingsField
              label="Öncelik Sırası"
              description="Yüksek değer = yüksek öncelik. Birden fazla kampanya uygulanabilir olduğunda önce yüksek öncelikli kampanya uygulanır"
            >
              <SettingsInput
                type="number"
                value={formData.priority}
                onChange={(e) => handleChange("priority", Number(e.target.value))}
                min="0"
                placeholder="0"
              />
            </SettingsField>
          </SettingsSection>

          <SettingsSection
            title="Durum"
            description="Kampanyanın aktiflik durumunu ayarlayın"
          >
            <SettingsToggle
              checked={formData.isActive}
              onChange={(checked) => handleChange("isActive", checked)}
              label="Kampanya Aktif"
              description="Aktif kampanyalar müşterilere gösterilir ve uygulanır"
            />
          </SettingsSection>
        </div>

        <SettingsSaveBar
          show={hasChanges || isNew}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={isSaving}
        />
      </div>
    </div>
  );
}
