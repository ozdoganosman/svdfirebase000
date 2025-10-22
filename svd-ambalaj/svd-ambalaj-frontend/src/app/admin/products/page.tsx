'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminMedia, AdminProduct, apiFetch, resolveMediaUrl, uploadMediaFile } from "@/lib/admin-api";
import { MediaPicker } from "@/components/admin/media/media-picker";

type ProductPayload = {
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  priceUSD?: number;
  bulkPricing?: ProductBulkRow[];
  bulkPricingUSD?: ProductBulkRow[];
  category?: string;
  images?: string;
  stock?: number;
  packageInfo?: {
    itemsPerBox?: number;
    minBoxes?: number;
    boxLabel?: string;
  };
  specifications?: {
    hoseLength?: string;
    volume?: string;
    color?: string;
    neckSize?: string;
  };
};

type ProductBulkRow = {
  id: string;
  minQty: string;
  price: string;
};

const createEmptyForm = (): ProductPayload => ({
  title: "",
  slug: "",
  description: "",
  price: undefined,
  bulkPricing: [],
  category: "",
  images: "",
  stock: undefined,
  packageInfo: {
    itemsPerBox: 1,
    minBoxes: 1,
    boxLabel: "Koli",
  },
  specifications: {
    hoseLength: "",
    volume: "",
    color: "",
    neckSize: "",
  },
});

const emptyForm: ProductPayload = createEmptyForm();

const FIELD_IDS = {
  title: "admin-product-title",
  slug: "admin-product-slug",
  description: "admin-product-description",
  price: "admin-product-price",
  stock: "admin-product-stock",
  category: "admin-product-category",
  images: "admin-product-images",
  itemsPerBox: "admin-product-items-per-box",
  minBoxes: "admin-product-min-boxes",
  boxLabel: "admin-product-box-label",
};

const randomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ products: AdminProduct[] }>("/products");
      setProducts(data.products ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiFetch<{ categories: Category[] }>("/categories");
      setCategories(data.categories ?? []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const parsedBulkPricing = useMemo(() => {
    const rows = form.bulkPricing ?? [];
    return rows
      .map((row) => ({
        minQty: Number(row.minQty),
        price: Number(row.price),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.minQty) &&
          Number.isFinite(row.price) &&
          row.minQty > 0 &&
          row.price > 0
      );
  }, [form.bulkPricing]);

  const hasBulkPricingError = useMemo(() => {
    const rows = form.bulkPricing ?? [];
    if (rows.length === 0) {
      return false;
    }
    return rows.some((row) => {
      const minQty = Number(row.minQty);
      const price = Number(row.price);
      return !Number.isFinite(minQty) || minQty <= 0 || !Number.isFinite(price) || price <= 0;
    });
  }, [form.bulkPricing]);

  const imageList = useMemo(
    () =>
      (form.images ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [form.images]
  );

  const handleChange = (key: keyof ProductPayload, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title || !form.category) {
      setError("Başlık ve kategori zorunludur");
      return;
    }

    if (hasBulkPricingError) {
      setError("Toplu fiyatlandırma satırlarında geçersiz değerler var.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: form.title,
      slug: form.slug?.trim() || undefined,
      description: form.description || "",
      price: form.price !== undefined && form.price !== null ? Number(form.price) : undefined,
      bulkPricing: parsedBulkPricing.length > 0 ? JSON.stringify(parsedBulkPricing) : undefined,
      category: form.category,
      images: form.images,
      stock: form.stock !== undefined && form.stock !== null ? Number(form.stock) : undefined,
      packageInfo: form.packageInfo ? {
        itemsPerBox: Number(form.packageInfo.itemsPerBox) || 1,
        minBoxes: 1,
        boxLabel: form.packageInfo.boxLabel || "Koli",
      } : undefined,
      specifications: form.specifications && (
        form.specifications.hoseLength || 
        form.specifications.volume || 
        form.specifications.color || 
        form.specifications.neckSize
      ) ? form.specifications : undefined,
    };

    console.log('📦 Form packageInfo:', form.packageInfo);
    console.log('📦 Payload packageInfo:', payload.packageInfo);

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await apiFetch<{ product: AdminProduct }>(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<{ product: AdminProduct }>("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await fetchProducts();
      const message = editingId ? "Ürün güncellendi" : "Ürün eklendi";
      resetForm();
      setSuccess(message);
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      bulkPricing: (product.bulkPricing ?? []).map((tier) => ({
        id: randomId(),
        minQty: String(tier.minQty ?? ""),
        price: String(tier.price ?? ""),
      })),
      category: product.category,
      images: product.images.join(", "),
      stock: product.stock,
      packageInfo: {
        itemsPerBox: product.packageInfo?.itemsPerBox ?? 1,
        minBoxes: product.packageInfo?.minBoxes ?? 1,
        boxLabel: product.packageInfo?.boxLabel ?? "Koli",
      },
      specifications: {
        hoseLength: product.specifications?.hoseLength ?? "",
        volume: product.specifications?.volume ?? "",
        color: product.specifications?.color ?? "",
        neckSize: product.specifications?.neckSize ?? "",
      },
    });
    setSuccess(null);
    setShowForm(true);
    // Scroll to form
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const handleCopy = (product: AdminProduct) => {
    setEditingId(null);
    setForm({
      title: `${product.title} (Kopya)`,
      slug: `${product.slug}-kopya`,
      description: product.description,
      price: product.price,
      bulkPricing: (product.bulkPricing ?? []).map((tier) => ({
        id: randomId(),
        minQty: String(tier.minQty ?? ""),
        price: String(tier.price ?? ""),
      })),
      category: product.category,
      images: product.images.join(", "),
      stock: product.stock,
      packageInfo: {
        itemsPerBox: product.packageInfo?.itemsPerBox ?? 1,
        minBoxes: product.packageInfo?.minBoxes ?? 1,
        boxLabel: product.packageInfo?.boxLabel ?? "Koli",
      },
      specifications: {
        hoseLength: product.specifications?.hoseLength ?? "",
        volume: product.specifications?.volume ?? "",
        color: product.specifications?.color ?? "",
        neckSize: product.specifications?.neckSize ?? "",
      },
    });
    setSuccess(null);
    setShowForm(true);
    // Scroll to form
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const handleRemoveImage = (url: string) => {
    setForm((prev) => {
      const updated = (prev.images ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value && value !== url);
      return {
        ...prev,
        images: updated.join(", "),
      };
    });
  };

  const handleMediaSelect = (media: AdminMedia) => {
    setForm((prev) => {
      const existing = (prev.images ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (!existing.includes(media.url)) {
        existing.push(media.url);
      }
      return {
        ...prev,
        images: existing.join(", "),
      };
    });
    setMediaPickerOpen(false);
    setSuccess(null);
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
    setError(null);
    setSuccess(null);
    try {
      const media = await uploadMediaFile(file);
      setForm((prev) => {
        const existing = (prev.images ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        if (!existing.includes(media.url)) {
          existing.push(media.url);
        }
        return {
          ...prev,
          images: existing.join(", "),
        };
      });
      setSuccess(`${media.originalName} yüklendi ve eklendi.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ürünü silmek istediğinize emin misiniz?")) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch<{ product: AdminProduct }>(`/products/${id}`, {
        method: "DELETE",
        parseJson: true,
      });

      await fetchProducts();
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Ürün silindi");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPricingChange = (index: number, key: 'minQty' | 'price', value: string) => {
    setForm((prev) => ({
      ...prev,
      bulkPricing: (prev.bulkPricing ?? []).map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [key]: value,
            }
          : row
      ),
    }));
  };

  const addBulkPricingRow = () => {
    setForm((prev) => ({
      ...prev,
      bulkPricing: [
        ...(prev.bulkPricing ?? []),
        {
          id: randomId(),
          minQty: "",
          price: "",
        },
      ],
    }));
  };

  const removeBulkPricingRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bulkPricing: (prev.bulkPricing ?? []).filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const presetBulkPricing = (preset: { minQty: number; price: number }[]) => {
    setForm((prev) => ({
      ...prev,
      bulkPricing: preset.map((item) => ({
        id: randomId(),
        minQty: String(item.minQty),
        price: String(item.price.toFixed(2)),
      })),
    }));
  };

  return (
    <div className="space-y-8">
      {/* SUCCESS/ERROR MESSAGES */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      {/* ÜRÜN LİSTESİ EN ÜSTTE */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Kayıtlı Ürünler</h2>
            <p className="text-sm text-slate-600">Toplam {products.length} ürün</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(createEmptyForm());
                setEditingId(null);
                setShowForm(true);
                setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
              }}
              className="inline-flex items-center rounded-md border border-amber-500 bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              + Yeni Ürün Ekle
            </button>
            <button
              type="button"
              onClick={fetchProducts}
              disabled={loading}
              className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-400"
            >
              Yenile
            </button>
          </div>
        </div>
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            <p className="mb-4">Henüz ürün bulunmuyor.</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="text-amber-600 hover:underline"
            >
              İlk ürünü ekle →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-700">Başlık</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Kategori</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Fiyat</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Stok</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Oluşturma</th>
                  <th className="px-3 py-2 font-medium text-slate-700">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const category = categories.find(cat => cat.id === product.category);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-900">{product.title}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {category ? category.name : product.category || '-'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{product.price.toLocaleString("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      })}</td>
                      <td className="px-3 py-2 text-slate-600">{product.stock}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {product.createdAt ? new Date(product.createdAt).toLocaleString("tr-TR") : "-"}
                      </td>
                      <td className="px-3 py-2 space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(product)}
                          className="inline-flex items-center rounded-md border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-50"
                        >
                          Kopyala
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* FORM EN ALTTA - Sadece showForm true ise göster */}
      {showForm && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {editingId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </h1>
          <p className="text-sm text-slate-600">
            {editingId ? 'Mevcut ürünü güncelleyin.' : 'Yeni bir ürün ekleyin.'}
          </p>
        </div>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.title}>Başlık</label>
            <input
              id={FIELD_IDS.title}
              name="title"
              type="text"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              placeholder="Ürün adı"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.slug}>Slug</label>
            <input
              id={FIELD_IDS.slug}
              name="slug"
              type="text"
              value={form.slug ?? ""}
              onChange={(event) => handleChange("slug", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              placeholder="opsiyonel"
            />
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.price}>
              Fiyat (TRY) <span className="text-xs text-slate-500">(opsiyonel - USD varsa otomatik hesaplanır)</span>
            </label>
            <input
              id={FIELD_IDS.price}
              name="price"
              type="number"
              step="0.01"
              value={form.price ?? ""}
              onChange={(event) => handleChange("price", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              placeholder="34.50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-product-price-usd">
              Fiyat (USD) <span className="text-xs font-semibold text-amber-600">✓ Önerilen</span>
            </label>
            <input
              id="admin-product-price-usd"
              name="priceUSD"
              type="number"
              step="0.01"
              value={form.priceUSD ?? ""}
              onChange={(event) => handleChange("priceUSD", event.target.value)}
              className="mt-1 w-full rounded-md border border-amber-500 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="1.00"
            />
            <p className="mt-1 text-xs text-slate-600">
              Dolar bazlı fiyat - Güncel kurla TL'ye çevrilir
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.stock}>Stok</label>
            <input
              id={FIELD_IDS.stock}
              name="stock"
              type="number"
              value={form.stock ?? ""}
              onChange={(event) => handleChange("stock", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            />
          </div>
          
          {/* KOLI BILGILERI SECTION */}
          <div className="md:col-span-2">
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
              <h3 className="mb-4 text-lg font-bold text-amber-900">📦 Koli Satış Bilgileri</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.itemsPerBox}>
                    Koli İçi Adet
                  </label>
                  <input
                    id={FIELD_IDS.itemsPerBox}
                    name="itemsPerBox"
                    type="number"
                    min="1"
                    value={form.packageInfo?.itemsPerBox ?? 1}
                    onChange={(event) => 
                      setForm((prev) => ({
                        ...prev,
                        packageInfo: {
                          itemsPerBox: Number(event.target.value) || 1,
                          minBoxes: 1,
                          boxLabel: prev.packageInfo?.boxLabel || "Koli",
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
                    placeholder="100"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-600">1 kolide kaç adet ürün var?</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.boxLabel}>
                    Paket Türü
                  </label>
                  <input
                    id={FIELD_IDS.boxLabel}
                    name="boxLabel"
                    type="text"
                    value={form.packageInfo?.boxLabel ?? "Koli"}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        packageInfo: {
                          itemsPerBox: prev.packageInfo?.itemsPerBox || 1,
                          minBoxes: 1,
                          boxLabel: event.target.value || "Koli",
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
                    placeholder="Koli, Paket, Kasa..."
                  />
                  <p className="mt-1 text-xs text-slate-600">Paketin adı (Koli/Paket/Kasa)</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* EK ÖZELLİKLER SECTION */}
          <div className="md:col-span-2">
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
              <h3 className="mb-4 text-lg font-bold text-blue-900">🔧 Ek Özellikler</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Hortum Boyu
                  </label>
                  <input
                    name="hoseLength"
                    type="text"
                    value={form.specifications?.hoseLength ?? ""}
                    onChange={(event) => 
                      setForm((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          hoseLength: event.target.value,
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Örn: 17 cm, 23 cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Hacim (ml)
                  </label>
                  <input
                    name="volume"
                    type="text"
                    value={form.specifications?.volume ?? ""}
                    onChange={(event) => 
                      setForm((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          volume: event.target.value,
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Örn: 250ml, 500ml"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Renk
                  </label>
                  <input
                    name="color"
                    type="text"
                    value={form.specifications?.color ?? ""}
                    onChange={(event) => 
                      setForm((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          color: event.target.value,
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Örn: Beyaz, Siyah, Şeffaf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Ağız Çapı
                  </label>
                  <input
                    name="neckSize"
                    type="text"
                    value={form.specifications?.neckSize ?? ""}
                    onChange={(event) => 
                      setForm((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          neckSize: event.target.value,
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Örn: 24/410, 28/400"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-blue-700">
                Bu alanlar opsiyoneldir. Ürün detaylarında görüntülenecektir.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.category}>
              Kategori *
            </label>
            <select
              id={FIELD_IDS.category}
              name="category"
              value={form.category ?? ""}
              onChange={(event) => handleChange("category", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              required
            >
              <option value="">Kategori seçin...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor={FIELD_IDS.images}>Görseller</label>
            <input
              id={FIELD_IDS.images}
              name="images"
              type="text"
              value={form.images ?? ""}
              onChange={(event) => handleChange("images", event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
              placeholder="/images/products/urun.jpg, ..."
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
              {imageList.length > 0 && (
                <span className="text-xs text-slate-500">Toplam {imageList.length} görsel seçildi.</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleDirectUploadChange}
              className="hidden"
            />
            {imageList.length > 0 && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {imageList.map((url) => {
                  const resolved = resolveMediaUrl(url);
                  return (
                    <div key={url} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
                      <div className="relative aspect-square w-full overflow-hidden rounded-md border border-slate-200 bg-white">
                        <img src={resolved} alt={url} className="absolute inset-0 h-full w-full object-cover" />
                      </div>
                      <div className="truncate text-xs text-slate-600" title={resolved}>
                        {url}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url)}
                        className="self-end text-xs font-semibold text-red-600 transition hover:text-red-700"
                      >
                        Kaldır
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Toplu Fiyatlandırma (Koli Bazlı)</label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => presetBulkPricing([
                    { minQty: 1, price: Number(form.price) || 1 },
                    { minQty: 100, price: (Number(form.price || 1) * 0.95) || 0.95 },
                    { minQty: 500, price: (Number(form.price || 1) * 0.9) || 0.9 },
                  ])}
                  className="rounded-md border border-slate-200 px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Örnek 3 Katman
                </button>
                <button
                  type="button"
                  onClick={() => presetBulkPricing([
                    { minQty: 1, price: Number(form.price) || 1 },
                    { minQty: 50, price: (Number(form.price || 1) * 0.96) || 0.96 },
                    { minQty: 200, price: (Number(form.price || 1) * 0.92) || 0.92 },
                    { minQty: 1000, price: (Number(form.price || 1) * 0.88) || 0.88 },
                  ])}
                  className="rounded-md border border-slate-200 px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Örnek 4 Katman
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              💡 Fiyatlar <strong>KOLİ ADEDİNE</strong> göredir. Örn: &quot;100+ adet&quot; = &quot;100+ koli satışında bu fiyat geçerlidir.&quot;
            </p>
            <div className="mt-3 space-y-3">
              {(form.bulkPricing ?? []).map((row, index) => {
                const minQtyInvalid = !row.minQty || Number(row.minQty) <= 0;
                const priceInvalid = !row.price || Number(row.price) <= 0;
                return (
                  <div key={row.id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label className="text-xs font-medium text-slate-600">Minimum Adet</label>
                      <input
                        type="number"
                        min={1}
                        value={row.minQty}
                        onChange={(event) => handleBulkPricingChange(index, 'minQty', event.target.value)}
                        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 ${
                          minQtyInvalid ? 'border-red-300' : 'border-slate-200'
                        }`}
                        placeholder="Örn. 100"
                        required
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-xs font-medium text-slate-600">Birim Fiyatı</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={row.price}
                        onChange={(event) => handleBulkPricingChange(index, 'price', event.target.value)}
                        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 ${
                          priceInvalid ? 'border-red-300' : 'border-slate-200'
                        }`}
                        placeholder="Örn. 4.25"
                        required
                      />
                    </div>
                    <div className="flex items-end justify-end sm:col-span-4">
                      <button
                        type="button"
                        onClick={() => removeBulkPricingRow(index)}
                        className="inline-flex items-center rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Satırı Sil
                      </button>
                    </div>
                    {(minQtyInvalid || priceInvalid) && (
                      <div className="sm:col-span-12 text-xs text-red-600">
                        Minimum adet ve fiyat 0’dan büyük olmalıdır.
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={addBulkPricingRow}
                  className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Katman Ekle
                </button>
                {hasBulkPricingError && (
                  <span className="text-xs text-red-600">Geçersiz değerler bulunuyor, lütfen kontrol edin.</span>
                )}
                {!form.bulkPricing?.length && (
                  <span className="text-xs text-slate-500">Toplu fiyatlandırma isteğe bağlıdır.</span>
                )}
              </div>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {saving ? "Kaydediliyor..." : editingId ? "Ürünü Güncelle" : "Yeni Ürün Ekle"}
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
      )}
      <MediaPicker isOpen={isMediaPickerOpen} onClose={() => setMediaPickerOpen(false)} onSelect={handleMediaSelect} />
    </div>
  );
}

