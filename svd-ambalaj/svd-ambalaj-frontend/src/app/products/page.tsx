import type { Metadata } from "next";
import Link from "next/link";
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);

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

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(resolveServerApiUrl("/products"), {
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

export default async function ProductsPage() {
  const products = await getProducts();
  const exchangeRate = await getExchangeRate();
  const rate = exchangeRate?.rate ?? 0;

  const resolveProductImage = (product: Product): string => {
    const imagePath = product.images?.[0] ?? product.image;
    if (!imagePath) {
      return "/images/placeholders/product.jpg";
    }
    // If it's already a full URL, return as-is
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
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

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <img
                  src={resolveProductImage(product)}
                  alt={product.title}
                  className="h-full w-full object-contain p-4 transition duration-500 hover:scale-110"
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
                      {formatDualPrice(product.priceUSD, rate, false, 1, product.price)} <span className="text-sm font-normal text-slate-500">+KDV</span>
                    </p>
                    {product.packageInfo && (
                      <p className="text-sm text-slate-600">
                        1 {product.packageInfo.boxLabel.toLowerCase()} = {formatDualPrice(product.priceUSD, rate, false, product.packageInfo.itemsPerBox, product.price ? product.price * product.packageInfo.itemsPerBox : undefined)} <span className="text-xs text-slate-500">+KDV</span>
                      </p>
                    )}
                  </div>
                  {((product.priceUSD && product.bulkPricingUSD && product.bulkPricingUSD.length > 0) || (product.bulkPricing && product.bulkPricing.length > 0)) && (
                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Toplu Alım Avantajı
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-amber-800">
                        {(product.priceUSD ? product.bulkPricingUSD : product.bulkPricing)?.slice(0, 3).map((tier) => {
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
                              <span className="font-semibold">{formatDualPrice(product.priceUSD ? tier.price : undefined, rate, false, 1, !product.priceUSD ? tier.price : undefined)} <span className="text-xs font-normal">+KDV</span></span>
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
                      price: product.priceUSD ? (product.priceUSD * rate) : (product.price ?? 0),
                      stock: product.stock,
                      bulkPricing: product.bulkPricing,
                      packageInfo: product.packageInfo,
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
