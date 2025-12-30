'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AdminMedia, AdminProduct, apiFetch, resolveMediaUrl, uploadMediaFile, VariantSegment, VariantOption, UploadProgressCallback } from "@/lib/admin-api";
import { MediaPicker } from "@/components/admin/media/media-picker";

type UploadProgress = {
  percent: number;
  stage: 'preparing' | 'uploading' | 'processing' | 'complete';
  message: string;
  fileName?: string;
};

type MultiUploadState = {
  isUploading: boolean;
  currentIndex: number;
  totalFiles: number;
  progress: UploadProgress | null;
};

type ProductPayload = {
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  priceUSD?: number;
  comboPriceUSD?: number;
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
    neckSize?: string; // Backend uses this for combo matching
  };
  variants?: VariantSegment[];
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
  variants: [],
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
  const [showForm, setShowForm] = useState(false);
  const [multiUpload, setMultiUpload] = useState<MultiUploadState>({
    isUploading: false,
    currentIndex: 0,
    totalFiles: 0,
    progress: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

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

  // TRY bulk pricing removed in USD-only mode

  const parsedBulkPricingUSD = useMemo(() => {
    const rows = form.bulkPricingUSD ?? [];
    return rows
      .map((row) => ({
        // Convert Turkish comma decimal separator to dot
        minQty: Number(String(row.minQty).replace(',', '.')),
        price: Number(String(row.price).replace(',', '.')),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.minQty) &&
          Number.isFinite(row.price) &&
          row.minQty > 0 &&
          row.price > 0
      );
  }, [form.bulkPricingUSD]);

  // TRY bulk pricing validation removed in USD-only mode

  const imageList = useMemo(
    () =>
      (form.images ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [form.images]
  );

  const handleChange = (key: keyof ProductPayload, value: string | number | null) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // USD-only mode: no currency switch. If any legacy TRY price exists in form state, migrate it once to USD field.
  useEffect(() => {
    setForm((prev) => {
      if (prev.price && (prev.priceUSD === undefined || prev.priceUSD === null)) {
        return { ...prev, priceUSD: Number(prev.price) || undefined, price: undefined, bulkPricing: [] };
      }
      return prev;
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('=== handleSubmit called ===', { title: form.title, category: form.category, priceUSD: form.priceUSD });
    if (!form.title || !form.category) {
      setError("Başlık ve kategori zorunludur");
      return;
    }

    // No TRY bulk pricing validation in USD-only mode

    // USD-only payload
    const payload: Record<string, unknown> = {
      title: form.title,
      slug: form.slug?.trim() || undefined,
      description: form.description || "",
      category: form.category,
      images: form.images,
      stock: form.stock !== undefined && form.stock !== null ? Number(form.stock) : undefined,
      // productType and neckSize are auto-determined by backend
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
      // Variants/Segments for configurable products
      variants: (form.variants && form.variants.length > 0) ? form.variants : undefined,
    };

    // Only USD fields are sent; TRY fields are explicitly nulled to clear legacy data
    // Convert Turkish comma decimal separator to dot for all price fields
    const usdPriceStr = String(form.priceUSD || '').trim().replace(',', '.');
    const usdPrice = usdPriceStr !== '' ? Number(usdPriceStr) : undefined;
    payload.priceUSD = usdPrice;
    payload.bulkPricingUSD = parsedBulkPricingUSD.length > 0 ? JSON.stringify(parsedBulkPricingUSD) : undefined;

    // Combo pricing
    const comboPriceStr = String(form.comboPriceUSD || '').trim().replace(',', '.');
    const comboPrice = comboPriceStr !== '' ? Number(comboPriceStr) : undefined;
    payload.comboPriceUSD = comboPrice;

    payload.price = null;
    payload.bulkPricing = null;

    console.log('USD-only payload:', JSON.stringify(payload, null, 2));

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
      priceUSD: product.priceUSD,
      comboPriceUSD: product.comboPriceUSD,
      bulkPricingUSD: (product.bulkPricingUSD ?? []).map((tier) => ({
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
      variants: product.variants ?? [],
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
      priceUSD: product.priceUSD,
      comboPriceUSD: product.comboPriceUSD,
      bulkPricingUSD: (product.bulkPricingUSD ?? []).map((tier) => ({
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
      variants: product.variants?.map(seg => ({
        ...seg,
        id: randomId(),
        options: seg.options.map(opt => ({ ...opt, id: randomId() })),
      })) ?? [],
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
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    await uploadMultipleFiles(Array.from(files));
    event.target.value = "";
  };

  const uploadMultipleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setError(null);
    setSuccess(null);
    setMultiUpload({
      isUploading: true,
      currentIndex: 0,
      totalFiles: files.length,
      progress: null,
    });

    const uploadedUrls: string[] = [];
    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setMultiUpload((prev) => ({
        ...prev,
        currentIndex: i,
        progress: {
          percent: 0,
          stage: 'preparing',
          message: 'Hazırlanıyor...',
          fileName: file.name,
        },
      }));

      const onProgress: UploadProgressCallback = (progress) => {
        setMultiUpload((prev) => ({
          ...prev,
          progress: {
            percent: progress.percent,
            stage: progress.stage,
            message: progress.message,
            fileName: file.name,
          },
        }));
      };

      try {
        const media = await uploadMediaFile(file, onProgress);
        uploadedUrls.push(media.url);
      } catch (err) {
        setError(`${file.name} yüklenemedi: ${(err as Error).message}`);
        hasError = true;
        break;
      }
    }

    // Add all successfully uploaded URLs to form
    if (uploadedUrls.length > 0) {
      setForm((prev) => {
        const existing = (prev.images ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        for (const url of uploadedUrls) {
          if (!existing.includes(url)) {
            existing.push(url);
          }
        }
        return {
          ...prev,
          images: existing.join(", "),
        };
      });

      if (!hasError) {
        setSuccess(`${uploadedUrls.length} görsel başarıyla yüklendi.`);
      }
    }

    setMultiUpload({
      isUploading: false,
      currentIndex: 0,
      totalFiles: 0,
      progress: null,
    });
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (files.length > 0) {
      await uploadMultipleFiles(files);
    }
  };

  // Image reordering
  const moveImage = (fromIndex: number, toIndex: number) => {
    setForm((prev) => {
      const images = (prev.images ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const [removed] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, removed);
      return {
        ...prev,
        images: images.join(", "),
      };
    });
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

  // TRY bulk handlers removed in USD-only mode

  const handleBulkPricingUSDChange = (index: number, key: 'minQty' | 'price', value: string) => {
    setForm((prev) => ({
      ...prev,
      bulkPricingUSD: (prev.bulkPricingUSD ?? []).map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [key]: value,
            }
          : row
      ),
    }));
  };

  // TRY bulk handlers removed in USD-only mode

  const addBulkPricingUSDRow = () => {
    setForm((prev) => ({
      ...prev,
      bulkPricingUSD: [
        ...(prev.bulkPricingUSD ?? []),
        {
          id: randomId(),
          minQty: "",
          price: "",
        },
      ],
    }));
  };

  // TRY bulk handlers removed in USD-only mode

  const removeBulkPricingUSDRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bulkPricingUSD: (prev.bulkPricingUSD ?? []).filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  // TRY bulk handlers removed in USD-only mode

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
                      <td className="px-3 py-2 text-slate-600">
                        {(() => {
                          const usd = Number(product.priceUSD);
                          if (Number.isFinite(usd) && usd > 0) {
                            return (
                              <span className="text-amber-700 font-semibold">${usd.toFixed(2)} USD</span>
                            );
                          }
                          return <span className="text-slate-400">Fiyat girilmemiş</span>;
                        })()}
                      </td>
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

        {/* USD-ONLY INFO */}
        <div className="rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
          <h3 className="text-lg font-bold text-amber-900">💰 Fiyatlandırma Para Birimi: USD (sabit)</h3>
          <p className="mt-1 text-sm text-amber-800">
            Fiyatları dolar olarak girin; müşteriye güncel kurla TL gösterilir. Eski TL fiyatlar otomatik kaldırılır.
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

          {/* FİYAT ALANI - USD ONLY */}
            <div>
               <label className="block text-sm font-medium text-slate-700" htmlFor="admin-product-price-usd">
                Birim Fiyat (USD) <span className="text-xs font-semibold text-amber-600">✓ Aktif</span>
              </label>
              <input
                id="admin-product-price-usd"
                name="priceUSD"
                type="text"
                inputMode="decimal"
                value={form.priceUSD ?? ""}
                onChange={(event) => handleChange("priceUSD", event.target.value)}
                className="mt-1 w-full rounded-md border border-amber-500 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="1.00 veya 1,00"
                required
              />
              <p className="mt-1 text-xs text-slate-600">
                Dolar bazlı fiyat - Güncel kurla TL&apos;ye çevrilip müşteriye gösterilir
              </p>
            </div>

          {/* COMBO PRICE - USD ONLY */}
            <div>
               <label className="block text-sm font-medium text-slate-700" htmlFor="admin-product-combo-price-usd">
                Kombo Fiyatı (USD) <span className="text-xs font-normal text-slate-500">Opsiyonel</span>
              </label>
              <input
                id="admin-product-combo-price-usd"
                name="comboPriceUSD"
                type="text"
                inputMode="decimal"
                value={form.comboPriceUSD ?? ""}
                onChange={(event) => handleChange("comboPriceUSD", event.target.value)}
                className="mt-1 w-full rounded-md border border-purple-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="0.90 veya 0,90"
              />
              <p className="mt-1 text-xs text-slate-600">
                Kombo indiriminde kullanılacak özel fiyat (boş bırakırsanız normal fiyat üzerinden indirim uygulanır)
              </p>
            </div>

          {/* COMBO DISCOUNT INFO */}
          <div className="md:col-span-2">
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-6">
              <h3 className="mb-4 text-lg font-bold text-purple-900">🔄 Kombinasyon İndirimi</h3>
              <div className="rounded-lg bg-purple-100 p-3 text-xs text-purple-800">
                <strong>💡 Otomatik Kombo İndirimi</strong><br />
                <strong>Ürün Tipi:</strong> Kategoriye göre otomatik belirlenir (Spreyler → Başlık, Şişeler → Şişe)<br/>
                <strong>Ağız Ölçüsü:</strong> Teknik Özelliklerdeki &ldquo;Ağız Ölçüsü&rdquo; alanından alınır<br/><br/>
                Aynı ağız ölçüsüne sahip başlık ve şişe kombine edildiğinde, az olan miktara kadar her ikisine de <strong>%10 indirim</strong> uygulanır.<br/>
                <strong>Örnek:</strong> 4500 başlık + 3000 şişe (24/410) = 3000 adet için %10 kombo indirimi
              </div>
            </div>
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
          {/* GÖRSELLER ALANI - Geliştirilmiş */}
          <div className="md:col-span-2">
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-semibold text-green-900">
                    🖼️ Ürün Görselleri
                  </label>
                  <p className="mt-1 text-xs text-green-800">
                    Birden fazla görsel yükleyebilirsiniz. İlk görsel ana görsel olarak kullanılır.
                    {imageList.length > 0 && <span className="font-semibold"> ({imageList.length} görsel)</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
                    disabled={multiUpload.isUploading}
                    className="inline-flex items-center rounded-md border border-green-600 bg-white px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Kütüphaneden Seç
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectUploadClick}
                    disabled={multiUpload.isUploading}
                    className="inline-flex items-center rounded-md border border-green-600 bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Bilgisayardan Yükle
                  </button>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                  isDragging
                    ? 'border-green-500 bg-green-100'
                    : 'border-green-300 bg-white hover:border-green-400 hover:bg-green-50'
                } ${multiUpload.isUploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                {isDragging ? (
                  <div className="flex flex-col items-center py-4">
                    <svg className="w-12 h-12 text-green-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm font-semibold text-green-700">Görselleri buraya bırakın</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-green-700">
                      Görselleri sürükleyip bırakın veya{' '}
                      <button
                        type="button"
                        onClick={handleDirectUploadClick}
                        className="font-semibold text-green-600 hover:text-green-800 underline"
                      >
                        dosya seçin
                      </button>
                    </p>
                    <p className="mt-1 text-xs text-green-600">PNG, JPG, GIF, WEBP veya MP4 - Birden fazla dosya seçebilirsiniz</p>
                  </div>
                )}
              </div>

              {/* Hidden file input - now accepts multiple files */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleDirectUploadChange}
                className="hidden"
              />

              {/* Upload Progress */}
              {multiUpload.isUploading && multiUpload.progress && (
                <div className="mt-4 rounded-lg border border-green-300 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {multiUpload.progress.stage === 'preparing' && (
                        <svg className="w-4 h-4 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {multiUpload.progress.stage === 'uploading' && (
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                      {multiUpload.progress.stage === 'processing' && (
                        <svg className="w-4 h-4 text-green-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      )}
                      {multiUpload.progress.stage === 'complete' && (
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="text-sm font-medium text-green-800">
                        {multiUpload.totalFiles > 1
                          ? `${multiUpload.currentIndex + 1}/${multiUpload.totalFiles}: ${multiUpload.progress.fileName}`
                          : multiUpload.progress.fileName}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-700">%{multiUpload.progress.percent}</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
                        multiUpload.progress.stage === 'complete' ? 'bg-green-600' :
                        multiUpload.progress.stage === 'processing' ? 'bg-green-500 animate-pulse' : 'bg-green-500'
                      }`}
                      style={{ width: `${multiUpload.progress.percent}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-green-600">
                    <span>{multiUpload.progress.message}</span>
                    {multiUpload.totalFiles > 1 && (
                      <span>Toplam: {multiUpload.currentIndex + 1} / {multiUpload.totalFiles}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Image Grid with Reordering */}
              {imageList.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-green-700 mb-2">
                    💡 Sıralamayı değiştirmek için ok butonlarını kullanın. İlk görsel vitrin görseli olarak kullanılır.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {imageList.map((url, index) => {
                      const resolved = resolveMediaUrl(url);
                      const isFirst = index === 0;
                      return (
                        <div
                          key={url}
                          className={`relative flex flex-col gap-2 rounded-lg border-2 p-3 shadow-sm transition-all ${
                            isFirst ? 'border-green-500 bg-green-100' : 'border-green-200 bg-white'
                          }`}
                        >
                          {isFirst && (
                            <span className="absolute -top-2 -left-2 inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                              Ana Görsel
                            </span>
                          )}
                          <div className="relative aspect-square w-full overflow-hidden rounded-md border border-green-200 bg-white">
                            <Image
                              src={resolved}
                              alt={url}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => moveImage(index, Math.max(0, index - 1))}
                                disabled={index === 0}
                                className="rounded-md border border-green-300 p-1.5 text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-30"
                                title="Yukarı Taşı"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveImage(index, Math.min(imageList.length - 1, index + 1))}
                                disabled={index === imageList.length - 1}
                                className="rounded-md border border-green-300 p-1.5 text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-30"
                                title="Aşağı Taşı"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(url)}
                              className="rounded-md border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
                              title="Görseli Kaldır"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hidden URL input for manual entry */}
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-green-700 hover:text-green-900">
                  Manuel URL girişi (gelişmiş)
                </summary>
                <input
                  id={FIELD_IDS.images}
                  name="images"
                  type="text"
                  value={form.images ?? ""}
                  onChange={(event) => handleChange("images", event.target.value)}
                  className="mt-2 w-full rounded-md border border-green-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                  placeholder="/images/products/urun.jpg, ..."
                />
              </details>
            </div>
          </div>

          {/* VARYANT/SEGMENT YÖNETİMİ */}
          <div className="md:col-span-2">
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-900">
                    🎨 Ürün Seçenekleri (Segmentler)
                  </label>
                  <p className="mt-1 text-xs text-purple-800">
                    Damlalık gibi çok parçalı ürünler için segment ve seçenekler ekleyin. Her seçeneğin ayrı stoğu olur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      variants: [
                        ...(prev.variants ?? []),
                        {
                          id: randomId(),
                          name: "",
                          required: true,
                          options: [],
                        },
                      ],
                    }));
                  }}
                  className="inline-flex items-center rounded-md border border-purple-600 bg-purple-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  + Segment Ekle
                </button>
              </div>

              {(form.variants ?? []).length === 0 && (
                <p className="text-sm text-purple-700 italic">
                  Henüz segment eklenmedi. Segment ekleyerek ürün seçenekleri oluşturabilirsiniz.
                </p>
              )}

              <div className="space-y-4">
                {(form.variants ?? []).map((segment, segmentIndex) => (
                  <div key={segment.id} className="rounded-lg border border-purple-300 bg-white p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-purple-800">Segment Adı</label>
                        <input
                          type="text"
                          value={segment.name}
                          onChange={(e) => {
                            setForm((prev) => ({
                              ...prev,
                              variants: prev.variants?.map((s, i) =>
                                i === segmentIndex ? { ...s, name: e.target.value } : s
                              ),
                            }));
                          }}
                          className="mt-1 w-full rounded-md border border-purple-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                          placeholder="Örn: Pipet Tipi, Kauçuk Rengi, Cam Rengi"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            variants: prev.variants?.filter((_, i) => i !== segmentIndex),
                          }));
                        }}
                        className="mt-5 inline-flex items-center rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Segmenti Sil
                      </button>
                    </div>

                    {/* Seçenekler */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-purple-800">Seçenekler</label>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              variants: prev.variants?.map((s, i) =>
                                i === segmentIndex
                                  ? {
                                      ...s,
                                      options: [
                                        ...s.options,
                                        { id: randomId(), name: "", stock: 0, priceModifier: 0 },
                                      ],
                                    }
                                  : s
                              ),
                            }));
                          }}
                          className="inline-flex items-center rounded-md border border-purple-400 px-2 py-1 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
                        >
                          + Seçenek Ekle
                        </button>
                      </div>

                      {segment.options.length === 0 && (
                        <p className="text-xs text-purple-600 italic">Henüz seçenek eklenmedi.</p>
                      )}

                      <div className="space-y-2">
                        {segment.options.map((option, optionIndex) => (
                          <div key={option.id} className="flex items-center gap-2 rounded-md border border-purple-100 bg-purple-50 p-2">
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) => {
                                setForm((prev) => ({
                                  ...prev,
                                  variants: prev.variants?.map((s, i) =>
                                    i === segmentIndex
                                      ? {
                                          ...s,
                                          options: s.options.map((o, j) =>
                                            j === optionIndex ? { ...o, name: e.target.value } : o
                                          ),
                                        }
                                      : s
                                  ),
                                }));
                              }}
                              className="flex-1 rounded-md border border-purple-200 px-2 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
                              placeholder="Seçenek adı"
                            />
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-purple-700">Stok:</label>
                              <input
                                type="number"
                                value={option.stock}
                                onChange={(e) => {
                                  setForm((prev) => ({
                                    ...prev,
                                    variants: prev.variants?.map((s, i) =>
                                      i === segmentIndex
                                        ? {
                                            ...s,
                                            options: s.options.map((o, j) =>
                                              j === optionIndex ? { ...o, stock: Number(e.target.value) || 0 } : o
                                            ),
                                          }
                                        : s
                                    ),
                                  }));
                                }}
                                className="w-20 rounded-md border border-purple-200 px-2 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
                                min="0"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  variants: prev.variants?.map((s, i) =>
                                    i === segmentIndex
                                      ? { ...s, options: s.options.filter((_, j) => j !== optionIndex) }
                                      : s
                                  ),
                                }));
                              }}
                              className="text-red-500 hover:text-red-700"
                              title="Seçeneği Sil"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(form.variants ?? []).length > 0 && (
                <p className="mt-3 text-xs text-purple-700">
                  💡 Müşteri sipariş verirken her segmentten bir seçenek seçecek. Stok, seçilen kombinasyondaki en düşük stok kadar satışa izin verir.
                </p>
              )}
            </div>
          </div>

          {/* TOPLU FİYATLANDIRMA USD */}
          <div className="md:col-span-2">
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-amber-900">
                    💵 Toplu Fiyatlandırma USD (Koli Bazlı)
                    <span className="ml-2 text-xs font-bold text-green-700">✓ ÖNERİLEN</span>
                  </label>
                  <p className="mt-1 text-xs text-amber-800">
                    💡 Fiyatlar <strong>KOLİ ADEDİNE</strong> göredir. Güncel kurla otomatik TL&apos;ye çevrilir.
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {(form.bulkPricingUSD ?? []).map((row, index) => {
                  const minQtyInvalid = !row.minQty || Number(row.minQty) <= 0;
                  const priceInvalid = !row.price || Number(row.price) <= 0;
                  return (
                    <div key={row.id} className="grid grid-cols-1 gap-3 rounded-lg border border-amber-300 bg-white p-3 sm:grid-cols-12">
                      <div className="sm:col-span-4">
                        <label className="text-xs font-medium text-amber-800">Minimum Koli Adedi</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.minQty}
                          onChange={(event) => handleBulkPricingUSDChange(index, 'minQty', event.target.value)}
                          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            minQtyInvalid ? 'border-red-300' : 'border-amber-200'
                          }`}
                          placeholder="Örn. 100"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-xs font-medium text-amber-800">Birim Fiyatı (USD)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.price}
                          onChange={(event) => handleBulkPricingUSDChange(index, 'price', event.target.value)}
                          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            priceInvalid ? 'border-red-300' : 'border-amber-200'
                          }`}
                          placeholder="Örn. 0.12 veya 0,12"
                        />
                      </div>
                      <div className="flex items-end justify-end sm:col-span-4">
                        <button
                          type="button"
                          onClick={() => removeBulkPricingUSDRow(index)}
                          className="inline-flex items-center rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Satırı Sil
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={addBulkPricingUSDRow}
                    className="inline-flex items-center rounded-md border border-amber-600 bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                  >
                    USD Katman Ekle
                  </button>
                  {!form.bulkPricingUSD?.length && (
                    <span className="text-xs text-amber-800">USD ile katmanlı fiyatlandırma yapabilirsiniz.</span>
                  )}
                </div>
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




