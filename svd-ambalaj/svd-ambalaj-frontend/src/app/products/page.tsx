import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { resolveServerApiUrl, resolveServerApiBase } from "@/lib/server-api";
import { formatDualPrice, type ExchangeRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Tüm Ürünler | SVD Ambalaj",
  description: "SVD Ambalaj ürün kataloğu - Sprey, pompa ve ambalaj çözümleri",
};

export const dynamic = 'force-dynamic';

type BulkTier = {
  minQty: number;
  price: number;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price?: number;
  priceUSD?: number;
  bulkPricing?: BulkTier[];
  bulkPricingUSD?: BulkTier[];
  images?: string[];
  image?: string;
  category?: string;
  stock?: number;
  packageInfo?: {
    itemsPerBox: number;
    minBoxes: number;
    boxLabel: string;
  };
  specifications?: {
    hoseLength?: string;
    volume?: string;
    color?: string;
    neckSize?: string;
  };
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Specifications = {
  hoseLengths: string[];
  volumes: string[];
  colors: string[];
  neckSizes: string[];
};

// formatCurrency unused here; rely on formatDualPrice for display

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(resolveServerApiUrl("/categories"), {
      cache: 'no-store'
    });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return payload?.categories ?? [];
  } catch (error) {
    console.error("Categories fetch error", error);
    return [];
  }
}

async function getSpecifications(): Promise<Specifications> {
  try {
    const response = await fetch(resolveServerApiUrl("/products/specifications"), {
      cache: 'no-store'
    });
    if (!response.ok) {
      return { hoseLengths: [], volumes: [], colors: [], neckSizes: [] };
    }
    const payload = await response.json();
    return {
      hoseLengths: payload?.hoseLengths ?? [],
      volumes: payload?.volumes ?? [],
      colors: payload?.colors ?? [],
      neckSizes: payload?.neckSizes ?? [],
    };
  } catch (error) {
    console.error("Specifications fetch error", error);
    return { hoseLengths: [], volumes: [], colors: [], neckSizes: [] };
  }
}

async function getExchangeRate(): Promise<ExchangeRate | null> {
  try {
    const apiBase = resolveServerApiBase();
    const response = await fetch(`${apiBase}/exchange-rate`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data?.exchangeRate ?? null;
  } catch (error) {
    console.error("Exchange rate fetch error", error);
    return null;
  }
}

async function getProducts(params?: { 
  q?: string; 
  category?: string; 
  sort?: string; 
  minPrice?: string; 
  maxPrice?: string;
  hoseLength?: string;
  volume?: string;
  color?: string;
  neckSize?: string;
}): Promise<Product[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.category && params.category !== "all") searchParams.set("category", params.category);
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.minPrice) searchParams.set("minPrice", params.minPrice);
    if (params?.maxPrice) searchParams.set("maxPrice", params.maxPrice);
    if (params?.hoseLength) searchParams.set("hoseLength", params.hoseLength);
    if (params?.volume) searchParams.set("volume", params.volume);
    if (params?.color) searchParams.set("color", params.color);
    if (params?.neckSize) searchParams.set("neckSize", params.neckSize);
    
    const query = searchParams.toString();
    const endpoint = query ? `/products/search?${query}` : "/products";
    
    const response = await fetch(resolveServerApiUrl(endpoint), {
      cache: 'no-store'
    });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return payload?.products ?? [];
  } catch (error) {
    console.error("Products fetch error", error);
    return [];
  }
}

export default async function ProductsPage({ searchParams }: { 
  searchParams?: Promise<{ 
    q?: string; 
    category?: string; 
    sort?: string; 
    minPrice?: string; 
    maxPrice?: string;
    hoseLength?: string;
    volume?: string;
    color?: string;
    neckSize?: string;
  }> 
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.toString() || "";
  const category = resolvedSearchParams?.category?.toString() || "";
  const sort = resolvedSearchParams?.sort?.toString() || "";
  const minPrice = resolvedSearchParams?.minPrice?.toString() || "";
  const maxPrice = resolvedSearchParams?.maxPrice?.toString() || "";
  const hoseLength = resolvedSearchParams?.hoseLength?.toString() || "";
  const volume = resolvedSearchParams?.volume?.toString() || "";
  const color = resolvedSearchParams?.color?.toString() || "";
  const neckSize = resolvedSearchParams?.neckSize?.toString() || "";
  
  const [products, categories, specifications, exchangeRate] = await Promise.all([
    getProducts({ q, category, sort, minPrice, maxPrice, hoseLength, volume, color, neckSize }),
    getCategories(),
    getSpecifications(),
    getExchangeRate()
  ]);
  
  const rate = exchangeRate?.rate ?? 0;

  const resolveProductImage = (product: Product): string => {
    const imagePath = product.images?.[0] ?? product.image;
    if (!imagePath) {
      return "/images/placeholders/product.jpg";
    }
    // Return URL as-is (unoptimized mode will handle it)
    return imagePath;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
            Tüm Ürünler
          </span>
          <h1 className="text-4xl font-bold tracking-tight">
            Sprey, Pompa ve Ambalaj Çözümleri
          </h1>
          <p className="text-lg text-slate-600">
            Endüstriyel üretiminiz için kaliteli ve uygun fiyatlı ürünlerimizi keşfedin. 
            Toplu alımlarda özel fiyat avantajlarından yararlanın.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-4 py-2 font-medium">
              {products.length} ürün listelendi
            </span>
          </div>
        </div>

        {/* Filters */}
        <form action="/products" method="get" className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="q" className="block text-sm font-medium text-slate-700 mb-2">Ürün Ara</label>
              <input 
                id="q" 
                name="q" 
                defaultValue={q} 
                placeholder="Ürün adı veya açıklama..." 
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20" 
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
              <select 
                id="category" 
                name="category" 
                defaultValue={category}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Tümü</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-slate-700 mb-2">Sıralama</label>
              <select 
                id="sort" 
                name="sort" 
                defaultValue={sort}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Varsayılan</option>
                <option value="title-asc">İsim (A-Z)</option>
                <option value="title-desc">İsim (Z-A)</option>
                <option value="price-asc">Fiyat (Düşük-Yüksek)</option>
                <option value="price-desc">Fiyat (Yüksek-Düşük)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button 
                type="submit" 
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Filtrele
              </button>
              {(q || category || sort || minPrice || maxPrice || hoseLength || volume || color || neckSize) && (
                <Link 
                  href="/products" 
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Temizle
                </Link>
              )}
            </div>
          </div>

          {/* Technical Specifications - Always visible for now */}
          <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Teknik Özellikler
              {(specifications.hoseLengths.length > 0 || specifications.volumes.length > 0 || specifications.colors.length > 0 || specifications.neckSizes.length > 0) && (
                <span className="ml-2 text-xs text-amber-600">
                  ({[specifications.hoseLengths.length, specifications.volumes.length, specifications.colors.length, specifications.neckSizes.length].filter(n => n > 0).length} kategori)
                </span>
              )}
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="hoseLength" className="block text-xs text-slate-600 mb-1">Hortum Boyu</label>
                <select 
                  id="hoseLength" 
                  name="hoseLength" 
                  defaultValue={hoseLength}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Tümü</option>
                  {specifications.hoseLengths.map(length => (
                    <option key={length} value={length}>{length}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="volume" className="block text-xs text-slate-600 mb-1">Hacim</label>
                <select 
                  id="volume" 
                  name="volume" 
                  defaultValue={volume}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Tümü</option>
                  {specifications.volumes.map(vol => (
                    <option key={vol} value={vol}>{vol}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="color" className="block text-xs text-slate-600 mb-1">Renk</label>
                <select 
                  id="color" 
                  name="color" 
                  defaultValue={color}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Tümü</option>
                  {specifications.colors.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="neckSize" className="block text-xs text-slate-600 mb-1">Boyun Ölçüsü</label>
                <select 
                  id="neckSize" 
                  name="neckSize" 
                  defaultValue={neckSize}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Tümü</option>
                  {specifications.neckSizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </details>

          {/* Price Range - Collapsible on mobile */}
          <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">Fiyat Aralığı (USD)</summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="minPrice" className="block text-xs text-slate-600 mb-1">Min</label>
                <input 
                  type="number" 
                  id="minPrice" 
                  name="minPrice" 
                  defaultValue={minPrice}
                  placeholder="0" 
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label htmlFor="maxPrice" className="block text-xs text-slate-600 mb-1">Max</label>
                <input 
                  type="number" 
                  id="maxPrice" 
                  name="maxPrice" 
                  defaultValue={maxPrice}
                  placeholder="999" 
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </details>
        </form>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
              Şu anda görüntülenecek ürün bulunamadı. Lütfen daha sonra tekrar deneyin.
            </div>
          )}

          {products.map((product) => (
            <article
              key={product.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <Image
                  src={resolveProductImage(product)}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain p-4 transition duration-500 hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <header className="space-y-2">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {product.title}
                  </h2>
                  {product.description && (
                    <p className="text-sm text-slate-600">
                      {product.description}
                    </p>
                  )}
                </header>

                {product.packageInfo && (
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm">
                    <p className="font-semibold text-amber-900">
                      📦 {product.packageInfo.itemsPerBox} adet/{product.packageInfo.boxLabel.toLowerCase()}
                    </p>
                  </div>
                )}

                {(product.specifications?.hoseLength || product.specifications?.volume || product.specifications?.color || product.specifications?.neckSize) && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Teknik Özellikler
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {product.specifications?.hoseLength && (
                        <li>• <strong>Hortum Boyu:</strong> {product.specifications.hoseLength}</li>
                      )}
                      {product.specifications?.volume && (
                        <li>• <strong>Hacim:</strong> {product.specifications.volume}</li>
                      )}
                      {product.specifications?.color && (
                        <li>• <strong>Renk:</strong> {product.specifications.color}</li>
                      )}
                      {product.specifications?.neckSize && (
                        <li>• <strong>Boyun Ölçüsü:</strong> {product.specifications.neckSize}</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-auto space-y-3">
                  <div>
                    <span className="text-sm text-slate-500">
                      {product.packageInfo ? "Birim fiyat" : "Başlangıç fiyatı"}
                    </span>
                    <p className="text-2xl font-bold text-amber-600">
                      {product.priceUSD && rate > 0 ? formatDualPrice(product.priceUSD, rate, true) : 'Fiyat için iletişime geçin'} <span className="text-sm font-normal text-slate-500">+KDV</span>
                    </p>
                    {product.packageInfo && (
                      <p className="text-sm text-slate-600">
                        1 {product.packageInfo.boxLabel.toLowerCase()} = {product.priceUSD && rate > 0 ? formatDualPrice(product.priceUSD, rate, false, product.packageInfo.itemsPerBox) : '—'} <span className="text-xs text-slate-500">+KDV</span>
                      </p>
                    )}
                  </div>
                  {(product.priceUSD && product.bulkPricingUSD && product.bulkPricingUSD.length > 0) && (
                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Toplu Alım Avantajı
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-amber-800">
                        {product.bulkPricingUSD?.slice(0, 3).map((tier) => {
                          const itemsPerBox = product.packageInfo?.itemsPerBox || 1;
                          const totalItems = tier.minQty * itemsPerBox;
                          return (
                            <li key={`${product.id}-tier-${tier.minQty}`} className="flex items-center justify-between">
                              <span>
                                {tier.minQty}+ koli
                                {itemsPerBox > 1 && (
                                  <span className="text-xs text-slate-600"> ({totalItems.toLocaleString('tr-TR')}+ adet)</span>
                                )}
                              </span>
                              <span className="font-semibold">{formatDualPrice(tier.price, rate, true)} <span className="text-xs font-normal">+KDV</span></span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <AddToCartButton
                    product={{
                      id: product.id,
                      title: product.title,
                      slug: product.slug,
                      price: product.priceUSD && rate > 0 ? (product.priceUSD * rate) : 0,
                      stock: product.stock,
                      images: product.images,
                      bulkPricing: product.priceUSD && product.bulkPricingUSD
                        ? product.bulkPricingUSD.map(tier => ({ minQty: tier.minQty, price: tier.price * rate }))
                        : undefined,
                      packageInfo: product.packageInfo,
                      specifications: product.specifications,
                    }}
                  />
                  <Link
                    href={`/products/${product.slug}`}
                    className="inline-flex items-center justify-center rounded-full border border-amber-500 px-5 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-500 hover:text-white"
                  >
                    Detayları Gör
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {products.length > 0 && (
          <div className="mt-16 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-2xl font-bold text-amber-900">
              Aradığınızı bulamadınız mı?
            </h2>
            <p className="mt-3 text-slate-700">
              Özel ürün talepleriniz için satış ekibimizle iletişime geçin. Size özel çözümler sunalım.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href="mailto:info@svdambalaj.com"
                className="rounded-full border border-amber-600 bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Teklif İste
              </a>
              <Link
                href="/#sample"
                className="rounded-full border border-amber-600 px-6 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-100"
              >
                Numune Talep Et
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
