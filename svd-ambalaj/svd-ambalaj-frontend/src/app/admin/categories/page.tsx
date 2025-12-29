'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AdminCategory, AdminMedia, apiFetch, resolveMediaUrl, uploadMediaFile, UploadProgressCallback } from "@/lib/admin-api";
import { MediaPicker } from "@/components/admin/media/media-picker";

type UploadProgress = {
  percent: number;
  stage: 'preparing' | 'uploading' | 'processing' | 'complete';
  message: string;
};

const emptyForm: CategoryPayload = {
  name: "",
  slug: "",
  description: "",
  image: "",
  productType: null,
};

type CategoryPayload = {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  productType?: string | null; // "başlık" | "şişe" | "nötr" | null
};

const FIELD_IDS = {
  name: "admin-category-name",
  slug: "admin-category-slug",
  description: "admin-category-description",
  image: "admin-category-image",
  productType: "admin-category-product-type",
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<CategoryPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const derivedSlug = useMemo(() => {
    if (form.slug && form.slug.length > 0) {
      return form.slug;
    }
    return form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-ğüşöçı]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, [form.name, form.slug]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ categories: AdminCategory[] }>("/categories");
      setCategories(response.categories ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (key: keyof CategoryPayload, value: string | null) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Kategori adı zorunludur");
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: derivedSlug || undefined,
      description: form.description?.trim() || undefined,
      image: form.image?.trim() || undefined,
      productType: form.productType || null,
    };

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await apiFetch<{ category: AdminCategory }>(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<{ category: AdminCategory }>("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await fetchCategories();
      resetForm();
      setSuccess(editingId ? "Kategori güncellendi" : "Kategori eklendi");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      image: category.image ?? "",
      productType: category.productType ?? null,
    });
    setSuccess(null);
  };

  const handleMediaSelect = (media: AdminMedia) => {
    setForm((prev) => ({
      ...prev,
      image: media.url,
    }));
    setMediaPickerOpen(false);
  };

  const handleDirectUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDirectUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingImage(true);
    setUploadProgress({ percent: 0, stage: 'preparing', message: 'Dosya hazirlanıyor...' });
    setError(null);
    setSuccess(null);

    const onProgress: UploadProgressCallback = (progress) => {
      setUploadProgress({
        percent: progress.percent,
        stage: progress.stage,
        message: progress.message,
      });
    };

    try {
      const media = await uploadMediaFile(file, onProgress);
      setForm((prev) => ({
        ...prev,
        image: media.url,
      }));
      setSuccess(`${media.originalName} yüklendi ve kategoriye eklendi.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
      event.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Kategoriyi silmek istediğinize emin misiniz?")) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/categories/${id}`, {
        method: "DELETE",
        parseJson: false,
      });
      await fetchCategories();
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Kategori silindi");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncProducts = async () => {
    if (!confirm("Tüm ürünlerin productType değeri kategorilerinden güncellenecek. Devam etmek istiyor musunuz?")) {
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch<{ message: string; total: number; updated: number; skipped: number }>(
        "/admin/update-products-from-categories",
        {
          method: "POST",
        }
      );
      setSuccess(`${response.updated} ürün güncellendi, ${response.skipped} ürün zaten günceldi. Toplam: ${response.total}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Kategori Yönetimi</h1>
          <p className="text-sm text-slate-600">
            Kategorileri oluşturun, düzenleyin ve ürünler için gruplamalar tanımlayın.
          </p>
        </div>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>
        )}
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.name}>Ad</label>
            <input
              id={FIELD_IDS.name}
              name="name"
              type="text"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              placeholder="Örn. Pet Şişeler"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.slug}>Slug</label>
            <input
              id={FIELD_IDS.slug}
              name="slug"
              type="text"
              value={derivedSlug}
              onChange={(event) => handleChange("slug", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              placeholder="pet-siseler"
            />
            <p className="mt-1 text-xs text-slate-500">Boş bırakırsanız otomatik oluşturulur.</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.productType}>
              Ürün Tipi (Kombo İndirim İçin)
            </label>
            <select
              id={FIELD_IDS.productType}
              name="productType"
              value={form.productType || ""}
              onChange={(event) => handleChange("productType", event.target.value || null)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            >
              <option value="">Seçiniz (Kombo için geçerli değil)</option>
              <option value="başlık">Başlık (Sprey, Trigger, Pompa)</option>
              <option value="şişe">Şişe (Pet Şişe, HDPE Şişe)</option>
              <option value="nötr">Nötr (Diğer Ürünler)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Bu kategorideki tüm ürünler seçilen ürün tipini alacak. Aynı ağız ölçüsüne sahip Başlık + Şişe kombine edildiğinde %10 indirim uygulanır.
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.description}>Açıklama</label>
            <textarea
              id={FIELD_IDS.description}
              name="description"
              value={form.description ?? ""}
              onChange={(event) => handleChange("description", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              rows={3}
              placeholder="Kategori hakkında kısa bilgi"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.image}>Görsel URL</label>
            <input
              id={FIELD_IDS.image}
              name="image"
              type="text"
              value={form.image ?? ""}
              onChange={(event) => handleChange("image", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              placeholder="/images/categories/pet-sise.jpg"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMediaPickerOpen(true)}
                className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Medya Kütüphanesinden Seç
              </button>
              <button
                type="button"
                onClick={handleDirectUploadClick}
                disabled={uploadingImage}
                className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {uploadingImage ? "Yükleniyor..." : "Bilgisayardan Yükle"}
              </button>
              {form.image && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                  className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Görseli Kaldır
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleDirectUploadChange}
              className="hidden"
            />
            {/* Upload Progress Bar */}
            {uploadingImage && uploadProgress && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {uploadProgress.stage === 'preparing' && (
                      <svg className="w-4 h-4 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {uploadProgress.stage === 'uploading' && (
                      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    {uploadProgress.stage === 'processing' && (
                      <svg className="w-4 h-4 text-amber-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    )}
                    {uploadProgress.stage === 'complete' && (
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-amber-800">{uploadProgress.message}</span>
                  </div>
                  <span className="text-sm font-bold text-amber-700">%{uploadProgress.percent}</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
                      uploadProgress.stage === 'complete' ? 'bg-green-500' :
                      uploadProgress.stage === 'processing' ? 'bg-amber-500 animate-pulse' : 'bg-amber-600'
                    }`}
                    style={{ width: `${uploadProgress.percent}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-amber-600">
                  <span>
                    {uploadProgress.stage === 'preparing' && 'Hazırlanıyor...'}
                    {uploadProgress.stage === 'uploading' && 'Sunucuya gönderiliyor'}
                    {uploadProgress.stage === 'processing' && 'Sunucuda işleniyor'}
                    {uploadProgress.stage === 'complete' && 'Tamamlandı!'}
                  </span>
                  <span>
                    {uploadProgress.stage === 'uploading' && uploadProgress.percent < 100 && '⬆️ Yükleniyor'}
                    {uploadProgress.stage === 'processing' && '⚙️ İşleniyor'}
                  </span>
                </div>
              </div>
            )}
            {form.image && !uploadingImage && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-slate-200 bg-white">
                  <Image
                    src={resolveMediaUrl(form.image)}
                    alt={form.image}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 truncate text-xs text-slate-600" title={resolveMediaUrl(form.image)}>
                  {form.image}
                </p>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">Opsiyonel. Ana sayfa bloklarında kullanılabilir.</p>
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {saving ? "Kaydediliyor..." : editingId ? "Kategoriyi Güncelle" : "Yeni Kategori Ekle"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                İptal
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Kayıtlı Kategoriler</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncProducts}
              disabled={syncing}
              className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? "Senkronize Ediliyor..." : "🔄 Ürünleri Senkronize Et"}
            </button>
            <button
              type="button"
              onClick={fetchCategories}
              disabled={loading}
              className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-400"
            >
              Yenile
            </button>
          </div>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Yükleniyor...</div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Henüz kategori bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-700">Ad</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Slug</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Ürün Tipi</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Açıklama</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Görsel</th>
                  <th className="px-3 py-2 font-medium text-slate-700">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-900">{category.name}</td>
                    <td className="px-3 py-2 text-slate-600">{category.slug}</td>
                    <td className="px-3 py-2">
                      {category.productType ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          category.productType === 'başlık' ? 'bg-blue-100 text-blue-700' :
                          category.productType === 'şişe' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {category.productType === 'başlık' ? '🔧 Başlık' :
                           category.productType === 'şişe' ? '🍶 Şişe' :
                           '⚪ Nötr'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {category.description ? (
                        <span className="line-clamp-2 max-w-xs text-xs text-slate-500">{category.description}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {category.image ? (
                        <span className="text-xs text-slate-500">{category.image}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="inline-flex items-center rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        className="inline-flex items-center rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <MediaPicker isOpen={isMediaPickerOpen} onClose={() => setMediaPickerOpen(false)} onSelect={handleMediaSelect} />
    </div>
  );
}
