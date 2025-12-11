import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  resolveServerApiBase,
  resolveServerApiOrigin,
} from "@/lib/server-api";
import { formatDualPrice, type ExchangeRate } from "@/lib/currency";

// Force dynamic rendering to always fetch fresh data
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
  price: number;
  priceUSD?: number;
  stock?: number;
  bulkPricing?: BulkTier[];
  bulkPricingUSD?: BulkTier[];
  images?: string[];
  image?: string;
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
  description?: string;
  image?: string;
};

async function getProducts(apiBase: string): Promise<Product[]> {
  try {
    const response = await fetch(`${apiBase}/products`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to load products', response.statusText);
      return [];
    }

    const payload = await response.json();
    return payload?.products ?? [];
  } catch (error) {
    console.error('Error fetching products', error);
    return [];
  }
}

async function getCategories(apiBase: string): Promise<Category[]> {
  try {
    const response = await fetch(`${apiBase}/categories`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('Failed to load categories', response.statusText);
      return [];
    }

    const payload = await response.json();
    return payload?.categories ?? [];
  } catch (error) {
    console.error('Error fetching categories', error);
    return [];
  }
}

async function getExchangeRate(apiBase: string): Promise<ExchangeRate | null> {
  try {
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

export default async function Home() {
  const apiBase = resolveServerApiBase();
  const apiOrigin = resolveServerApiOrigin();

  const resolveMediaPath = (path: string | undefined | null): string => {
    if (!path) {
      return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('/uploads/') && apiOrigin) {
      return `${apiOrigin}${path}`;
    }
    return path;
  };

  const resolveProductImage = (product: Product): string =>
    resolveMediaPath(product.images?.[0] ?? product.image) || '/images/placeholders/product.jpg';

  const [products, categories, exchangeRate] = await Promise.all([
    getProducts(apiBase),
    getCategories(apiBase),
    getExchangeRate(apiBase),
  ]);

  // Avantajlar
  const advantages = [
    {
      icon: "🔄",
      title: "Kombo İndirimi",
      description: "Başlık + Şişe birlikte alana %10 indirim",
      highlight: "%10",
    },
    {
      icon: "📦",
      title: "Toplu Alım Avantajı",
      description: "Adet arttıkça birim fiyat düşer",
      highlight: "Kademeli Fiyat",
    },
    {
      icon: "🚚",
      title: "Hızlı Kargo",
      description: "50.000+ adet siparişlerde ücretsiz kargo",
      highlight: "Ücretsiz",
    },
    {
      icon: "💳",
      title: "Güvenli Ödeme",
      description: "Kredi kartı ve havale ile ödeme",
      highlight: "3D Secure",
    },
  ];

  return (
    <main className="min-h-screen w-full bg-white text-slate-900">
      {/* Hero Section - Kompakt */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
            {/* Sol - Text */}
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400"></span>
                B2B Ambalaj Çözümleri
              </div>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Sprey, Pompa ve PET Şişe
                <span className="block text-amber-400">Toptan Satış</span>
              </h1>
              <p className="max-w-lg text-lg text-slate-300">
                Kozmetik, temizlik ve kişisel bakım sektörü için kaliteli ambalaj ürünleri.
                Toplu alımlarda özel fiyatlar.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
                >
                  Ürünleri İncele
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Teklif Al
                </Link>
              </div>
              {/* Mini Stats */}
              <div className="flex flex-wrap gap-6 pt-4 text-sm">
                <div>
                  <span className="text-2xl font-bold text-amber-400">{products.length}+</span>
                  <span className="ml-2 text-slate-400">Ürün</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-amber-400">{categories.length}</span>
                  <span className="ml-2 text-slate-400">Kategori</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-amber-400">24</span>
                  <span className="ml-2 text-slate-400">Ülkeye İhracat</span>
                </div>
              </div>
            </div>

            {/* Sağ - Featured Products Preview */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-3">
                {products.slice(0, 4).map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg transition hover:shadow-xl hover:scale-[1.02] ${
                      index === 0 ? 'col-span-2 row-span-1' : ''
                    }`}
                  >
                    <div className={`relative ${index === 0 ? 'h-40' : 'h-32'} w-full bg-white`}>
                      <Image
                        src={resolveProductImage(product)}
                        alt={product.title}
                        fill
                        className="object-contain p-4 transition group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-3">
                      <p className="text-xs font-medium text-white truncate">{product.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantajlar Şeridi */}
      <section className="border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-amber-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">
            {advantages.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xl">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{item.title}</h3>
                    <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                      {item.highlight}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kategoriler */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Kategoriler</h2>
              <p className="mt-1 text-sm text-slate-600">İhtiyacınıza uygun ürünleri keşfedin</p>
            </div>
            <Link
              href="/categories"
              className="hidden items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700 sm:inline-flex"
            >
              Tümünü Gör
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.slice(0, 10).map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-amber-300 hover:shadow-lg"
              >
                <div className="relative h-32 w-full overflow-hidden bg-slate-50">
                  <Image
                    src={resolveMediaPath(category.image) || "/images/placeholders/category.jpg"}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="flex items-center justify-between p-3">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-amber-600">
                    {category.name}
                  </h3>
                  <svg className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Tüm Kategorileri Gör
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Fiyatlandırma Bilgi Kartları */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">Nasıl Çalışır?</h2>
            <p className="mt-2 text-slate-600">Toplu alım avantajlarından yararlanın</p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {/* Kombo İndirimi */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-2xl text-white">
                  🔄
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Kombo İndirimi</h3>
                  <p className="text-sm text-amber-600 font-semibold">%10 Anında İndirim</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Aynı ağız ölçüsüne sahip <strong>başlık + şişe</strong> birlikte aldığınızda otomatik %10 indirim!</p>
                <div className="rounded-lg bg-amber-100/50 p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Örnek:</strong> 24/410 başlık + 24/410 şişe = Her iki üründe %10 indirim
                  </p>
                </div>
              </div>
            </div>

            {/* Kademeli Fiyatlandırma */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-2xl text-white">
                  📊
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Kademeli Fiyat</h3>
                  <p className="text-sm text-blue-600 font-semibold">Çok Al Az Öde</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Sipariş miktarı arttıkça <strong>birim fiyat düşer</strong>. Her ürünün fiyat tablosunu inceleyin.</p>
                <div className="rounded-lg bg-blue-100/50 p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Örnek:</strong> 5 koli = ₺2.50/adet → 20 koli = ₺2.10/adet
                  </p>
                </div>
              </div>
            </div>

            {/* Kargo Koşulları */}
            <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-2xl text-white">
                  🚚
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Kargo</h3>
                  <p className="text-sm text-green-600 font-semibold">50.000+ Adet Ücretsiz</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p><strong>50.000 adet</strong> ve üzeri siparişlerde Türkiye geneli ücretsiz kargo.</p>
                <div className="rounded-lg bg-green-100/50 p-3">
                  <p className="text-xs text-green-800">
                    <strong>Altında:</strong> Koli başına ₺120 kargo ücreti uygulanır
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Döviz Kuru Bilgisi */}
          {exchangeRate && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-sm text-slate-600">
                Fiyatlar USD bazlı olup, güncel TCMB kuru ile TL&apos;ye çevrilmektedir.
                <span className="ml-2 font-semibold text-slate-900">
                  $1 = ₺{exchangeRate.rate.toFixed(2)}
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  ({new Date(exchangeRate.effectiveDate).toLocaleDateString("tr-TR")})
                </span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Öne Çıkan Ürünler */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Öne Çıkan Ürünler</h2>
              <p className="mt-1 text-sm text-slate-600">En çok tercih edilen ürünlerimiz</p>
            </div>
            <Link
              href="/products"
              className="hidden items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700 sm:inline-flex"
            >
              Tüm Ürünler ({products.length})
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                Ürünler yükleniyor...
              </div>
            )}

            {products.slice(0, 8).map((product) => (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-amber-300 hover:shadow-lg"
              >
                <Link href={`/products/${product.slug}`} className="relative h-44 w-full overflow-hidden bg-slate-50">
                  <Image
                    src={resolveProductImage(product)}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-4 transition duration-300 group-hover:scale-105"
                  />
                  {/* Bulk Pricing Badge */}
                  {product.bulkPricingUSD && product.bulkPricingUSD.length > 0 && (
                    <div className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
                      Toplu Alım Fırsatı
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 line-clamp-2">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Specs */}
                  {product.specifications?.neckSize && (
                    <p className="mt-1 text-xs text-slate-500">
                      Ağız: {product.specifications.neckSize}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-auto pt-3">
                    <p className="text-lg font-bold text-amber-600">
                      {product.priceUSD && exchangeRate
                        ? formatDualPrice(product.priceUSD, exchangeRate.rate, true)
                        : 'Fiyat için tıklayın'}
                      <span className="ml-1 text-xs font-normal text-slate-500">+KDV</span>
                    </p>
                    {product.packageInfo && (
                      <p className="text-xs text-slate-500">
                        {product.packageInfo.itemsPerBox} adet/koli
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1">
                      <AddToCartButton
                        product={{
                          id: product.id,
                          title: product.title,
                          slug: product.slug,
                          price: product.priceUSD && exchangeRate ? product.priceUSD * exchangeRate.rate : 0,
                          priceUSD: product.priceUSD,
                          stock: product.stock,
                          images: product.images,
                          bulkPricing: product.priceUSD && product.bulkPricingUSD && exchangeRate
                            ? product.bulkPricingUSD.map(tier => ({ minQty: tier.minQty, price: tier.price * exchangeRate.rate }))
                            : undefined,
                          bulkPricingUSD: product.bulkPricingUSD,
                          packageInfo: product.packageInfo,
                          specifications: product.specifications,
                        }}
                      />
                    </div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-600 transition hover:border-amber-400 hover:text-amber-600"
                      title="Detayları Gör"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Tüm Ürünleri Görüntüle
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-600 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
            <div>
              <h2 className="text-2xl font-bold">Toplu Sipariş mi Vermek İstiyorsunuz?</h2>
              <p className="mt-2 text-amber-100">
                Özel fiyat teklifi için sepetinizi doldurun veya bizimle iletişime geçin.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-amber-600 shadow-lg transition hover:bg-amber-50"
              >
                Teklif Oluştur
              </Link>
              <a
                href="mailto:info@svdambalaj.com"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                İletişime Geç
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Trust Badges */}
      <section className="border-t border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏭</span>
              <span>1998&apos;den Beri</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <span>24 Ülkeye İhracat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>ISO 9001:2015</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>Güvenli Ödeme</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📞</span>
              <span>7/24 Destek</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
