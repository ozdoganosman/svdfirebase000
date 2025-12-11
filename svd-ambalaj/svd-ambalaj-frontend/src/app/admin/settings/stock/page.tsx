"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, StockSettings } from "@/lib/settings-api";
import { apiFetch } from "@/lib/admin-api";
import {
  SettingsSection,
  SettingsField,
  SettingsInput,
  SettingsToggle,
  SettingsSaveBar,
} from "@/components/admin/settings";

type StockAlertData = {
  outOfStock: Array<{ id: string; title: string; stock: number }>;
  critical: Array<{ id: string; title: string; stock: number }>;
  low: Array<{ id: string; title: string; stock: number }>;
  summary: {
    outOfStockCount: number;
    criticalCount: number;
    lowCount: number;
    totalAlerts: number;
  };
};

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

  // Stock alerts state
  const [stockAlerts, setStockAlerts] = useState<StockAlertData | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  useEffect(() => {
    loadSettings();
    loadStockAlerts();
  }, []);

  const loadStockAlerts = async () => {
    try {
      setAlertsLoading(true);
      const data = await apiFetch<StockAlertData>("/admin/stock/alerts");
      setStockAlerts(data);
    } catch (err) {
      console.error("Failed to load stock alerts:", err);
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleSendAlert = async () => {
    try {
      setSendingAlert(true);
      setError(null);
      const result = await apiFetch<{ success: boolean; message: string }>("/admin/stock/send-alert", {
        method: "POST",
      });
      setSuccessMessage(result.message);
    } catch (err) {
      console.error("Failed to send stock alert:", err);
      setError(err instanceof Error ? err.message : "Stok uyarısı gönderilemedi");
    } finally {
      setSendingAlert(false);
    }
  };

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

        {/* Stock Alerts Panel */}
        <SettingsSection
          title="Mevcut Stok Uyarıları"
          description="Şu an dikkat gerektiren ürünleri görüntüleyin ve bildirim gönderin"
        >
          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stockAlerts ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-center">
                  <span className="text-3xl">🚫</span>
                  <p className="text-2xl font-bold text-red-700 mt-1">{stockAlerts.summary.outOfStockCount}</p>
                  <p className="text-sm text-red-600">Stokta Yok</p>
                </div>
                <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg text-center">
                  <span className="text-3xl">🚨</span>
                  <p className="text-2xl font-bold text-orange-700 mt-1">{stockAlerts.summary.criticalCount}</p>
                  <p className="text-sm text-orange-600">Kritik</p>
                </div>
                <div className="p-4 bg-amber-100 border border-amber-300 rounded-lg text-center">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{stockAlerts.summary.lowCount}</p>
                  <p className="text-sm text-amber-600">Düşük</p>
                </div>
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg text-center">
                  <span className="text-3xl">📊</span>
                  <p className="text-2xl font-bold text-slate-700 mt-1">{stockAlerts.summary.totalAlerts}</p>
                  <p className="text-sm text-slate-600">Toplam Uyarı</p>
                </div>
              </div>

              {/* Product Lists */}
              {stockAlerts.outOfStock.length > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                    <h4 className="font-semibold text-red-900">🚫 Stokta Olmayan Ürünler ({stockAlerts.outOfStock.length})</h4>
                  </div>
                  <ul className="divide-y divide-red-100">
                    {stockAlerts.outOfStock.slice(0, 5).map((product) => (
                      <li key={product.id} className="px-4 py-2 flex justify-between items-center text-sm">
                        <span className="text-slate-700">{product.title}</span>
                        <span className="text-red-600 font-semibold">0 adet</span>
                      </li>
                    ))}
                    {stockAlerts.outOfStock.length > 5 && (
                      <li className="px-4 py-2 text-sm text-slate-500 text-center">
                        +{stockAlerts.outOfStock.length - 5} ürün daha...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {stockAlerts.critical.length > 0 && (
                <div className="border border-orange-200 rounded-lg overflow-hidden">
                  <div className="bg-orange-50 px-4 py-2 border-b border-orange-200">
                    <h4 className="font-semibold text-orange-900">🚨 Kritik Stok ({stockAlerts.critical.length})</h4>
                  </div>
                  <ul className="divide-y divide-orange-100">
                    {stockAlerts.critical.slice(0, 5).map((product) => (
                      <li key={product.id} className="px-4 py-2 flex justify-between items-center text-sm">
                        <span className="text-slate-700">{product.title}</span>
                        <span className="text-orange-600 font-semibold">{product.stock} adet</span>
                      </li>
                    ))}
                    {stockAlerts.critical.length > 5 && (
                      <li className="px-4 py-2 text-sm text-slate-500 text-center">
                        +{stockAlerts.critical.length - 5} ürün daha...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {stockAlerts.low.length > 0 && (
                <div className="border border-amber-200 rounded-lg overflow-hidden">
                  <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
                    <h4 className="font-semibold text-amber-900">⚠️ Düşük Stok ({stockAlerts.low.length})</h4>
                  </div>
                  <ul className="divide-y divide-amber-100">
                    {stockAlerts.low.slice(0, 5).map((product) => (
                      <li key={product.id} className="px-4 py-2 flex justify-between items-center text-sm">
                        <span className="text-slate-700">{product.title}</span>
                        <span className="text-amber-600 font-semibold">{product.stock} adet</span>
                      </li>
                    ))}
                    {stockAlerts.low.length > 5 && (
                      <li className="px-4 py-2 text-sm text-slate-500 text-center">
                        +{stockAlerts.low.length - 5} ürün daha...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {stockAlerts.summary.totalAlerts === 0 && (
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="text-4xl">✅</span>
                  <p className="text-green-800 font-semibold mt-2">Tüm ürünler yeterli stokta!</p>
                  <p className="text-sm text-green-600">Stok seviyelerinde herhangi bir uyarı bulunmuyor.</p>
                </div>
              )}

              {/* Send Alert Button */}
              {stockAlerts.summary.totalAlerts > 0 && formData.notifyOnLowStock && formData.notifyEmail && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-indigo-900">Stok Uyarısı Gönder</p>
                    <p className="text-sm text-indigo-700">
                      {formData.notifyEmail} adresine e-posta gönder
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendAlert}
                    disabled={sendingAlert}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    {sendingAlert ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <span>📧</span>
                        Uyarı Gönder
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Refresh Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={loadStockAlerts}
                  disabled={alertsLoading}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Yenile
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-500">
              Stok verileri yüklenemedi
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
