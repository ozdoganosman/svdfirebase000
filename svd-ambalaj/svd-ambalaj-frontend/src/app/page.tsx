import Image from "next/image";
import Link from "next/link";
import {
  resolveServerApiBase,
  resolveServerApiOrigin,
} from "@/lib/server-api";
import { formatCurrency, convertUSDToTRY, type ExchangeRate } from "@/lib/currency";
import { getThumbnailUrl } from "@/lib/image-utils";
import { FloatingProducts } from "@/components/floating-products";

// Revalidate every 30 seconds for quick updates
export const revalidate = 30;

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
  category?: string;
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
      next: { revalidate: 120 }
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

type LandingContent = {
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    primaryButton: { text: string; href: string };
    secondaryButton: { text: string; href: string };
    stats: { value: string; label: string }[];
  };
  advantages?: { icon: string; title: string; description: string; highlight: string }[];
  howItWorks: {
    title: string;
    subtitle: string;
    cards: { icon: string; color: string; title: string; subtitle: string; description: string; example: string }[];
  };
  cta: {
    title: string;
    description: string;
    primaryButton: { text: string; href: string };
    secondaryButton: { text: string; href: string };
  };
  trustBadges: { icon: string; text: string }[];
  sections: {
    categoriesTitle: string;
    categoriesSubtitle: string;
    productsTitle: string;
    productsSubtitle: string;
  };
  featuredProducts?: string[];
  sectionOrder?: string[];
};

async function getLandingContent(apiBase: string): Promise<LandingContent | null> {
  try {
    const response = await fetch(`${apiBase}/landing-content`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data?.content ?? null;
  } catch (error) {
    console.error("Landing content fetch error", error);
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

  // Thumbnail version for hero section and listings
  const resolveProductThumbnail = (product: Product): string => {
    const original = resolveProductImage(product);
    if (original === '/images/placeholders/product.jpg') return original;
    return getThumbnailUrl(original) || original;
  };

  const [products, categories, exchangeRate, landingContent] = await Promise.all([
    getProducts(apiBase),
    getCategories(apiBase),
    getExchangeRate(apiBase),
    getLandingContent(apiBase),
  ]);

  // Fallback defaults if no landing content
  const hero = landingContent?.hero ?? {
    badge: "B2B Ambalaj Çözümleri",
    title: "Sprey, Pompa ve PET Şişe",
    titleHighlight: "Toptan Satış",
    description: "Kozmetik, temizlik ve kişisel bakım sektörü için kaliteli ambalaj ürünleri. Toplu alımlarda özel fiyatlar.",
    primaryButton: { text: "Ürünleri İncele", href: "/products" },
    secondaryButton: { text: "Teklif Al", href: "/cart" },
    stats: [{ value: "24", label: "Ülkeye İhracat" }],
  };

  // Default kartlar + her zaman eklenen 2 yeni kart
  const defaultCards = [
    { icon: "🔄", color: "amber", title: "Kombo İndirimi", subtitle: "%10 Anında İndirim", description: "Aynı ağız ölçüsüne sahip başlık + şişe birlikte aldığınızda otomatik %10 indirim!", example: "" },
    { icon: "📊", color: "blue", title: "Kademeli Fiyat", subtitle: "Çok Al Az Öde", description: "Sipariş miktarı arttıkça birim fiyat düşer. Her ürünün fiyat tablosunu inceleyin.", example: "" },
    { icon: "🚚", color: "green", title: "Kargo", subtitle: "50.000+ Koli Ücretsiz", description: "50.000 koli ve üzeri siparişlerde Türkiye geneli ücretsiz kargo.", example: "" },
  ];
  const additionalCards = [
    { icon: "💳", color: "purple", title: "Kredi Kartı", subtitle: "Güvenli Ödeme", description: "Kredi kartı ve banka havalesi ile güvenli ödeme yapabilirsiniz.", example: "" },
    { icon: "💵", color: "emerald", title: "Dolar Bazlı", subtitle: "Güncel Kur", description: "Fiyatlar USD bazlıdır. Her gün TCMB kuruna göre otomatik güncellenir.", example: "" },
  ];

  const baseHowItWorks = landingContent?.howItWorks ?? {
    title: "Nasıl Çalışır?",
    subtitle: "Toplu alım avantajlarından yararlanın",
    cards: defaultCards,
  };

  // Her zaman 2 yeni kartı ekle (eğer zaten yoksa)
  const howItWorks = {
    ...baseHowItWorks,
    cards: [
      ...baseHowItWorks.cards.filter((c: { title: string }) => !['Kredi Kartı', 'Dolar Bazlı'].includes(c.title)),
      ...additionalCards,
    ],
  };

  // CTA and trustBadges removed from landing page

  const sections = landingContent?.sections ?? {
    categoriesTitle: "Kategoriler",
    categoriesSubtitle: "İhtiyacınıza uygun ürünleri keşfedin",
    productsTitle: "Öne Çıkan Ürünler",
    productsSubtitle: "En çok tercih edilen ürünlerimiz",
  };

  // Featured products - filter by IDs or use first 4
  const featuredProductIds = landingContent?.featuredProducts ?? [];
  const featuredProducts = featuredProductIds.length > 0
    ? featuredProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined)
    : products.slice(0, 4);

  // Section order - default order if not set (advantages, cta ve trustBadges kaldırıldı)
  const sectionOrder = landingContent?.sectionOrder ?? [
    "hero", "categories", "howItWorks", "products"
  ];

  // Section components map
  const sectionComponents: Record<string, React.ReactNode> = {
    hero: (
      <section key="hero" className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
            {/* Sol - Text */}
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400"></span>
                {hero.badge}
              </div>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                {hero.title}
                <span className="block text-amber-400">{hero.titleHighlight}</span>
              </h1>
              <p className="max-w-lg text-lg text-slate-300">
                {hero.description}
              </p>

              {/* Butonlar */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={hero.primaryButton.href}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-amber-600"
                >
                  {hero.primaryButton.text}
                </Link>
                <Link
                  href={hero.secondaryButton.href}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  {hero.secondaryButton.text}
                </Link>
              </div>

              {/* İstatistikler */}
              {hero.stats && hero.stats.length > 0 && (
                <div className="flex flex-wrap gap-6 pt-4">
                  {/* Otomatik istatistikler */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{products.length}+</div>
                    <div className="text-xs text-slate-400">Ürün</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{categories.length}</div>
                    <div className="text-xs text-slate-400">Kategori</div>
                  </div>
                  {/* Kullanıcı tanımlı istatistikler */}
                  {hero.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-amber-400">{stat.value}</div>
                      <div className="text-xs text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sağ - Tüm Ürünler Floating */}
            <div className="flex-1 relative h-[350px] lg:h-[450px] hidden sm:block overflow-visible">
              <FloatingProducts products={products} apiOrigin={apiOrigin} />
              <div className="absolute bottom-[20%] right-[20%] w-32 h-32 rounded-full bg-blue-400/8 blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
    ),
    categories: (
      <section key="categories" className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{sections.categoriesTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{sections.categoriesSubtitle}</p>
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
            {categories.slice(0, 10).map((category) => {
              // Bu kategorideki ürünleri bul
              const categoryProducts = products.filter(p => p.category === category.id);
              const productImages = categoryProducts
                .slice(0, 4)
                .map(p => resolveProductThumbnail(p))
                .filter(Boolean);

              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-amber-300 hover:shadow-lg"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-300 via-slate-200 to-blue-100">
                    {productImages.length >= 4 ? (
                      // 4 ürün varsa 2x2 grid
                      <div className="grid grid-cols-2 grid-rows-2 h-full">
                        {productImages.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative overflow-hidden">
                            <Image
                              src={img}
                              alt={categoryProducts[idx]?.title || category.name}
                              fill
                              sizes="(max-width: 640px) 25vw, 10vw"
                              className="object-contain p-1 transition duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : productImages.length >= 2 ? (
                      // 2-3 ürün varsa yan yana
                      <div className="grid grid-cols-2 h-full">
                        {productImages.slice(0, 2).map((img, idx) => (
                          <div key={idx} className="relative overflow-hidden">
                            <Image
                              src={img}
                              alt={categoryProducts[idx]?.title || category.name}
                              fill
                              sizes="(max-width: 640px) 25vw, 10vw"
                              className="object-contain p-2 transition duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : productImages.length === 1 ? (
                      // Tek ürün
                      <Image
                        src={productImages[0]}
                        alt={categoryProducts[0]?.title || category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 20vw"
                        className="object-contain p-3 transition duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : category.image ? (
                      // Kategori görseli
                      <Image
                        src={resolveMediaPath(category.image) || "/images/placeholders/category.jpg"}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 20vw"
                        className="object-cover transition duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      // Placeholder
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-amber-600">
                        {category.name}
                      </h3>
                      {categoryProducts.length > 0 && (
                        <p className="text-xs text-slate-500">{categoryProducts.length} ürün</p>
                      )}
                    </div>
                    <svg className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
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
    ),
    howItWorks: (
      <section key="howItWorks" className="bg-gradient-to-b from-slate-900 to-slate-800 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white lg:text-xl">{howItWorks.title}</h2>
              <p className="text-xs text-slate-400">{howItWorks.subtitle}</p>
            </div>
            {exchangeRate && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5">
                <span className="text-amber-400 text-xs font-medium">$1 = ₺{exchangeRate.rate.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Kompakt Kartlar */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {howItWorks.cards.map((card, index) => {
              const colorClasses: Record<string, { iconBg: string; subtitleText: string; border: string }> = {
                amber: { iconBg: 'bg-amber-500', subtitleText: 'text-amber-400', border: 'border-amber-500/20' },
                blue: { iconBg: 'bg-blue-500', subtitleText: 'text-blue-400', border: 'border-blue-500/20' },
                green: { iconBg: 'bg-emerald-500', subtitleText: 'text-emerald-400', border: 'border-emerald-500/20' },
                purple: { iconBg: 'bg-purple-500', subtitleText: 'text-purple-400', border: 'border-purple-500/20' },
                red: { iconBg: 'bg-red-500', subtitleText: 'text-red-400', border: 'border-red-500/20' },
              };
              const colors = colorClasses[card.color] ?? colorClasses.amber;

              const icons = [
                <svg key="combo" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>,
                <svg key="bulk" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>,
                <svg key="shipping" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>,
                <svg key="creditcard" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>,
                <svg key="dollar" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>,
              ];

              return (
                <div
                  key={index}
                  className={`flex flex-col gap-2 rounded-lg border ${colors.border} bg-slate-800/50 p-3 transition-all hover:bg-slate-800`}
                >
                  {/* Header with Icon */}
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}>
                      {icons[index] || icons[0]}
                    </div>
                    <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                  </div>
                  {/* Subtitle */}
                  <span className={`text-xs font-medium ${colors.subtitleText}`}>{card.subtitle}</span>
                  {/* Description - full text */}
                  <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
    products: (
      <section key="products" className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{sections.productsTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">{sections.productsSubtitle}</p>
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

          <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {featuredProducts.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                Ürünler yükleniyor...
              </div>
            )}

            {featuredProducts.map((product) => {
              // En düşük ve en yüksek fiyatları hesapla (base price + bulk pricing)
              const basePrice = product.priceUSD ?? 0;
              const bulkPrices = product.bulkPricingUSD?.map(t => t.price) ?? [];
              const allPrices = [basePrice, ...bulkPrices].filter(p => p > 0);

              const lowestPriceUSD = allPrices.length > 0 ? Math.min(...allPrices) : basePrice;
              const highestPriceUSD = allPrices.length > 0 ? Math.max(...allPrices) : basePrice;

              // En düşük fiyatlı tier'ı bul (minQty için)
              const lowestTier = product.bulkPricingUSD?.reduce((min, tier) =>
                tier.price < min.price ? tier : min,
                product.bulkPricingUSD?.[0]
              );
              const lowestMinQty = lowestTier?.minQty ?? 1;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-amber-300 hover:shadow-lg"
                >
                  {/* Compact Image */}
                  <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-gradient-to-br from-slate-300 via-slate-200 to-blue-100">
                    <Image
                      src={resolveProductThumbnail(product)}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-contain p-2 transition duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Bulk Pricing Badge */}
                    {product.bulkPricingUSD && product.bulkPricingUSD.length > 0 && (
                      <div className="absolute left-1.5 top-1.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        💰 İndirimli
                      </div>
                    )}
                  </div>

                  {/* Compact Content */}
                  <div className="flex flex-1 flex-col p-2.5">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-amber-600 line-clamp-2 leading-tight">
                      {product.title}
                    </h3>

                    {/* Compact Specs */}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.specifications?.neckSize && (
                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          ⭕ {product.specifications.neckSize}
                        </span>
                      )}
                      {product.packageInfo && (
                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          📦 {product.packageInfo.itemsPerBox}/koli
                        </span>
                      )}
                    </div>

                    {/* Price with range: lowest (green) - highest (amber) */}
                    <div className="mt-auto pt-2">
                      {lowestPriceUSD && exchangeRate ? (
                        <>
                          {/* USD fiyatları - üstte */}
                          <div className="flex items-baseline gap-1 text-[10px] text-slate-500 mb-0.5">
                            <span>${lowestPriceUSD.toFixed(3)}</span>
                            {highestPriceUSD && highestPriceUSD !== lowestPriceUSD && (
                              <>
                                <span>-</span>
                                <span>${highestPriceUSD.toFixed(3)}</span>
                              </>
                            )}
                          </div>
                          {/* TL fiyatları - altta */}
                          <div className="flex items-baseline gap-1 flex-wrap">
                            <span className="text-sm sm:text-base font-bold text-green-600">
                              {formatCurrency(convertUSDToTRY(lowestPriceUSD, exchangeRate.rate), "TRY")}
                            </span>
                            {highestPriceUSD && highestPriceUSD !== lowestPriceUSD && (
                              <>
                                <span className="text-slate-400 text-xs">-</span>
                                <span className="text-sm sm:text-base font-bold text-amber-600">
                                  {formatCurrency(convertUSDToTRY(highestPriceUSD, exchangeRate.rate), "TRY")}
                                </span>
                              </>
                            )}
                            <span className="text-[10px] font-normal text-slate-400">+KDV</span>
                          </div>
                          {highestPriceUSD && highestPriceUSD !== lowestPriceUSD && (
                            <p className="text-[10px] text-green-600 font-medium">
                              {lowestMinQty}+ kolide en düşük
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">Fiyat için tıklayın</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
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
    ),
  };

  return (
    <main className="min-h-screen w-full bg-white text-slate-900">
      {/* Render sections in the order defined by sectionOrder */}
      {sectionOrder.map((sectionId) => sectionComponents[sectionId])}
    </main>
  );
}
