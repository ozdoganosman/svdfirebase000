'use client';

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/admin-api";

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

export default function AdminComboSettingsPage() {
  const [form, setForm] = useState<ComboSettings>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ settings: ComboSettings }>("/combo-settings");
      if (response.settings) {
        setForm(response.settings);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: keyof ComboSettings, value: ComboSettings[keyof ComboSettings]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleToggleActive = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const newActive = !form.isActive;
      await apiFetch("/admin/combo-settings/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      setForm((prev) => ({ ...prev, isActive: newActive }));
      setSuccess(`Kombo indirimi ${newActive ? "aktif" : "pasif"} edildi`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.discountValue <= 0) {
      setError("İndirim değeri sıfırdan büyük olmalıdır");
      return;
    }

    if (form.minQuantity < 0) {
      setError("Minimum miktar sıfır veya daha büyük olmalıdır");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        isActive: form.isActive,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        applicableTypes: form.applicableTypes,
        requireSameNeckSize: form.requireSameNeckSize,
        minQuantity: Number(form.minQuantity),
      };

      await apiFetch("/admin/combo-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSuccess("Kombo ayarları başarıyla güncellendi");
      fetchSettings();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplicableTypeToggle = (type: string) => {
    setForm((prev) => {
      const types = prev.applicableTypes.includes(type)
        ? prev.applicableTypes.filter((t) => t !== type)
        : [...prev.applicableTypes, type];
      return { ...prev, applicableTypes: types };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">Kombo İndirimi Ayarları</h1>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <p className="text-slate-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">Kombo İndirimi Ayarları</h1>
          <button
            onClick={handleToggleActive}
            disabled={saving}
            className={`rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-all ${
              form.isActive
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-slate-300 text-slate-700 hover:bg-slate-400"
            } disabled:opacity-50`}
          >
            {form.isActive ? "✓ Aktif" : "✗ Pasif"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl space-y-6">
          {/* Discount Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              İndirim Tipi
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.discountType === "percentage"}
                  onChange={() => handleChange("discountType", "percentage")}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Yüzde (%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.discountType === "fixed"}
                  onChange={() => handleChange("discountType", "fixed")}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Sabit Tutar ($)</span>
              </label>
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <label htmlFor="discountValue" className="block text-sm font-semibold text-slate-700 mb-2">
              İndirim Değeri {form.discountType === "percentage" ? "(%)" : "($)"}
            </label>
            <input
              type="number"
              id="discountValue"
              value={form.discountValue}
              onChange={(e) => handleChange("discountValue", Number(e.target.value))}
              step={form.discountType === "percentage" ? "1" : "0.01"}
              min="0"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
            <p className="mt-1 text-xs text-slate-500">
              {form.discountType === "percentage"
                ? "Örnek: 10 girdiğinizde %10 indirim uygulanır"
                : "Örnek: 0.02 girdiğinizde her ürün için $0.02 indirim uygulanır"}
            </p>
          </div>

          {/* Minimum Quantity */}
          <div>
            <label htmlFor="minQuantity" className="block text-sm font-semibold text-slate-700 mb-2">
              Minimum Kombo Miktarı
            </label>
            <input
              type="number"
              id="minQuantity"
              value={form.minQuantity}
              onChange={(e) => handleChange("minQuantity", Number(e.target.value))}
              min="0"
              step="1"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
            <p className="mt-1 text-xs text-slate-500">
              Kombo indiriminin uygulanması için gereken minimum ürün adedi
            </p>
          </div>

          {/* Applicable Types */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Uygulanabilir Ürün Tipleri
            </label>
            <div className="flex gap-4">
              {["başlık", "şişe", "nötr"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.applicableTypes.includes(type)}
                    onChange={() => handleApplicableTypeToggle(type)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 rounded"
                  />
                  <span className="text-sm text-slate-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              En az iki farklı tip seçilmelidir
            </p>
          </div>

          {/* Require Same Neck Size */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requireSameNeckSize}
                onChange={(e) => handleChange("requireSameNeckSize", e.target.checked)}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 rounded"
              />
              <span className="text-sm font-semibold text-slate-700">
                Aynı ağız ölçüsü gerekli
              </span>
            </label>
            <p className="mt-1 text-xs text-slate-500 ml-6">
              Eğer işaretliyse, sadece aynı ağız ölçüsüne sahip ürünler için kombo uygulanır
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving || form.applicableTypes.length < 2}
              className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </button>
          </div>

          {/* Info Box */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
            <p className="font-semibold mb-2">ℹ️ Kombo İndirimi Nasıl Çalışır?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Müşteri farklı tiplerde ürünler aldığında (örn: başlık + şişe)</li>
              <li>Eşleşen minimum miktar kadar ürüne indirim uygulanır</li>
              <li>Örnek: 4500 başlık + 3000 şişe → 3000 adede kombo indirim</li>
              <li>İndirim otomatik olarak sepet ve checkout sayfalarında gösterilir</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
