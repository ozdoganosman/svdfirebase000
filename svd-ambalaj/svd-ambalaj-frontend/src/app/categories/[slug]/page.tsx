import type { Metadata } from "next";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { resolveServerApiUrl, resolveServerApiBase } from "@/lib/server-api";
import { formatDualPrice, type ExchangeRate } from "@/lib/currency";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  priceUSD?: number;
  stock?: number;
  bulkPricing?: { minQty: number; price: number }[];
  bulkPricingUSD?: { minQty: number; price: number }[];
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

// TRY formatting removed in USD-only flow

async function getCategory(slug: string): Promise<Category | undefined> {
  try {
    const response = await fetch(resolveServerApiUrl("/categories"), {
      next: { revalidate: 120 },
    });
    if (!response.ok) {
      return undefined;
    }
    const payload = await response.json();
    return payload?.categories?.find((category: Category) => category.slug === slug);
  } catch (error) {
    console.error("Category fetch error", error);
    return undefined;
  }
}

async function getCategoryProducts(slug: string): Promise<Product[]> {
  try {
    const response = await fetch(
      resolveServerApiUrl(`/categories/${slug}/products`),
      {
        next: { revalidate: 120 },
      }
    );
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return payload?.products ?? [];
  } catch (error) {
    console.error("Category products fetch error", error);
    return [];
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Kategori bulunamadı | SVD Ambalaj",
    };
  }

  return {
    title: `${category.name} | SVD Ambalaj`,
    description: category.description,
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q?.toString() || "";
  const [category, allProducts, exchangeRate] = await Promise.all([
    getCategory(slug),
    getCategoryProducts(slug),
    getExchangeRate(),
  ]);
  const products = q
    ? allProducts.filter(p => p.title.toLowerCase().includes(q.toLowerCase()) || (p.description?.toLowerCase().includes(q.toLowerCase()) ?? false))
    : allProducts;

  if (!category) {
    return (
      <main className="min-h-screen bg-slate-50 py-20 text-slate-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-bold">Kategori bulunamadı</h1>
          <p className="mt-4 text-slate-600">
            Aradığınız kategori kaldırılmış olabilir. Diğer ürün kategorilerimizi görüntülemek için{" "}
            <Link href="/categories" className="font-semibold text-amber-600 hover:underline">
              tıklayın.
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
            {category.name}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            {category.name} çözümlerimizle üretiminizi güçlendirin
          </h1>
          {category.description && (
            <p className="mt-3 text-lg text-slate-600">{category.description}</p>
          )}
        </div>

        {/* Filters */}
        <form action={`/categories/${slug}`} method="get" className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="q" className="block text-sm font-medium text-slate-700">Ürün ara</label>
            <input id="q" name="q" defaultValue={q} placeholder="Bu kategoride ara…" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Uygula</button>
            {q && (
              <Link href={`/categories/${slug}`} className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Temizle</Link>
            )}
          </div>
        </form>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
              Bu kategori için henüz ürün eklenmemiş. Lütfen daha sonra tekrar kontrol edin.
            </div>
          )}

          {products.map((product) => (
            <article
              key={product.id}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg"
            >
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">{product.title}</h2>
                <p className="text-sm text-slate-600">{product.description}</p>
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
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Başlangıç fiyatı
                  </span>
                  <p className="text-2xl font-bold text-amber-600">
                    {product.priceUSD && exchangeRate
                      ? formatDualPrice(product.priceUSD, exchangeRate.rate, true)
                      : 'Fiyat için iletişime geçin'}
                  </p>
                </div>
                {(product.bulkPricingUSD) && (product.bulkPricingUSD?.length || 0) > 0 && (
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Toplu alım avantajı
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-amber-800">
                      {product.bulkPricingUSD?.map((tier) => {
                        const itemsPerBox = product.packageInfo?.itemsPerBox || 1;
                        const totalItems = tier.minQty * itemsPerBox;
                        return (
                          <li key={`${product.id}-${tier.minQty}`} className="flex items-center justify-between">
                            <span>
                              {tier.minQty}+ koli
                              {itemsPerBox > 1 && (
                                <span className="text-xs text-slate-600"> ({totalItems.toLocaleString('tr-TR')}+ adet)</span>
                              )}
                            </span>
                            <span className="font-semibold">
                              {product.bulkPricingUSD && exchangeRate
                                ? formatDualPrice(tier.price, exchangeRate.rate, true)
                                : '—'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <AddToCartButton
                  product={{
                    id: product.id,
                    title: product.title,
                    slug: product.slug,
                    price: product.priceUSD && exchangeRate ? (product.priceUSD * exchangeRate.rate) : 0,
                    bulkPricing: product.priceUSD && product.bulkPricingUSD && exchangeRate
                      ? product.bulkPricingUSD.map(tier => ({ minQty: tier.minQty, price: tier.price * exchangeRate.rate }))
                      : undefined,
                    packageInfo: product.packageInfo,
                  }}
                />
                <Link
                  href={`/products/${product.slug}`}
                  className="inline-flex items-center justify-center rounded-full border border-amber-500 px-5 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-500 hover:text-white"
                >
                  Ürün Detayı
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
