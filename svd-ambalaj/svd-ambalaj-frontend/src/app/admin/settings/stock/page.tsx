"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, StockSettings } from "@/lib/settings-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
} from "@/components/admin/settings";

export default function StockSettingsPage() {
  const [settings, setSettings] = useState<StockSettings | null>(null);
  const [formData, setFormData] = useState({
    lowStockThreshold: 100,
    criticalStockThreshold: 20,
    allowZeroStockOrders: false,
    notifyOnLowStock: true,
    notifyEmail: "",
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
      const data = await getSettings<StockSettings>("stock");
      setSettings(data);
      setFormData({
        lowStockThreshold: data.lowStockThreshold ?? 100,
        criticalStockThreshold: data.criticalStockThreshold ?? 20,
        allowZeroStockOrders: data.allowZeroStockOrders ?? false,
        notifyOnLowStock: data.notifyOnLowStock ?? true,
        notifyEmail: data.notifyEmail || "",
      });
    } catch (err) {
      console.error("Failed to load stock settings:", err);
      // If no settings exist, use defaults
      setFormData({
        lowStockThreshold: 100,
        criticalStockThreshold: 20,
        allowZeroStockOrders: false,
        notifyOnLowStock: true,
        notifyEmail: "",
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
    // Validation
    if (formData.criticalStockThreshold >= formData.lowStockThreshold) {
      setError("Kritik stok seviyesi, düşük stok seviyesinden küçük olmalıdır");
      return;
    }

    if (formData.notifyOnLowStock && !formData.notifyEmail) {
      setError("Bildirim aktifse e-posta adresi gereklidir");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateSettings<StockSettings>("stock", formData);
      setHasChanges(false);
      setSuccessMessage("Stok ayarları başarıyla kaydedildi");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save stock settings:", err);
      setError("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        lowStockThreshold: settings.lowStockThreshold ?? 100,
        criticalStockThreshold: settings.criticalStockThreshold ?? 20,
        allowZeroStockOrders: settings.allowZeroStockOrders ?? false,
        notifyOnLowStock: settings.notifyOnLowStock ?? true,
        notifyEmail: settings.notifyEmail || "",
      });
    }
    setHasChanges(false);
    setSuccessMessage(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Stok ayarları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Stok Yönetimi Ayarları</h2>
          <p className="text-sm text-slate-600 mt-1">
            Stok uyarı seviyeleri ve bildirim ayarlarını yapılandırın
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
          title="Stok Seviyeleri"
          description="Stok uyarıları için eşik değerlerini belirleyin"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold text-amber-900">Düşük Stok Seviyesi</span>
              </div>
              <SettingsField
                label="Eşik Değeri (adet)"
                description="Bu seviyenin altına düşen ürünler için uyarı verilir"
              >
                <SettingsInput
                  type="number"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleChange("lowStockThreshold", Number(e.target.value))}
                  placeholder="100"
                />
              </SettingsField>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🚨</span>
                <span className="font-semibold text-red-900">Kritik Stok Seviyesi</span>
              </div>
              <SettingsField
                label="Eşik Değeri (adet)"
                description="Bu seviyenin altında acil tedarik gerekir"
              >
                <SettingsInput
                  type="number"
                  min="0"
                  value={formData.criticalStockThreshold}
                  onChange={(e) => handleChange("criticalStockThreshold", Number(e.target.value))}
                  placeholder="20"
                />
              </SettingsField>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Stok Seviyesi Gösterimi</h4>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-600">Normal ({formData.lowStockThreshold}+ adet)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-slate-600">Düşük ({formData.criticalStockThreshold}-{formData.lowStockThreshold} adet)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-slate-600">Kritik (0-{formData.criticalStockThreshold} adet)</span>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Sipariş Ayarları"
          description="Stok durumuna göre sipariş davranışlarını belirleyin"
        >
          <SettingsToggle
            checked={formData.allowZeroStockOrders}
            onChange={(checked) => handleChange("allowZeroStockOrders", checked)}
            label="Stok Sıfırken Sipariş Almaya İzin Ver"
            description="Aktif olduğunda, stokta olmayan ürünler için de sipariş alınabilir (ön sipariş)"
          />

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Öneri</p>
                <p>
                  B2B satışlarda stok sıfırken sipariş almak, tedarik sürecini müşteriye bildirmek
                  koşuluyla tercih edilebilir. Siparişler &quot;Tedarik Bekleniyor&quot; durumunda gösterilir.
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Bildirimler"
          description="Stok uyarı bildirimlerini yapılandırın"
        >
          <SettingsToggle
            checked={formData.notifyOnLowStock}
            onChange={(checked) => handleChange("notifyOnLowStock", checked)}
            label="Düşük Stok Bildirimi Gönder"
            description="Stok düşük veya kritik seviyeye düştüğünde e-posta bildirimi gönder"
          />

          {formData.notifyOnLowStock && (
            <div className="mt-4">
              <SettingsField
                label="Bildirim E-posta Adresi"
                description="Stok uyarılarının gönderileceği e-posta adresi"
                required
              >
                <SettingsInput
                  type="email"
                  value={formData.notifyEmail}
                  onChange={(e) => handleChange("notifyEmail", e.target.value)}
                  placeholder="stok@sirketim.com"
                />
              </SettingsField>
            </div>
          )}
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
