import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  resolveServerApiBase,
  resolveServerApiOrigin,
} from "@/lib/server-api";
import { formatDualPrice, type ExchangeRate } from "@/lib/currency";

// Revalidate every 2 minutes for better performance while staying fresh
export const revalidate = 120;

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
  // advantages removed - features shown in howItWorks section
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

  // advantages section removed - features already shown in howItWorks section

  const howItWorks = landingContent?.howItWorks ?? {
    title: "Nasıl Çalışır?",
    subtitle: "Toplu alım avantajlarından yararlanın",
    cards: [
      { icon: "🔄", color: "amber", title: "Kombo İndirimi", subtitle: "%10 Anında İndirim", description: "Aynı ağız ölçüsüne sahip başlık + şişe birlikte aldığınızda otomatik %10 indirim!", example: "24/410 başlık + 24/410 şişe = Her iki üründe %10 indirim" },
      { icon: "📊", color: "blue", title: "Kademeli Fiyat", subtitle: "Çok Al Az Öde", description: "Sipariş miktarı arttıkça birim fiyat düşer. Her ürünün fiyat tablosunu inceleyin.", example: "5 koli = ₺2.50/adet → 20 koli = ₺2.10/adet" },
      { icon: "🚚", color: "green", title: "Kargo", subtitle: "50.000+ Adet Ücretsiz", description: "50.000 adet ve üzeri siparişlerde Türkiye geneli ücretsiz kargo.", example: "Altında: Koli başına ₺120 kargo ücreti uygulanır" },
    ],
  };

  const cta = landingContent?.cta ?? {
    title: "Toplu Sipariş mi Vermek İstiyorsunuz?",
    description: "Özel fiyat teklifi için sepetinizi doldurun veya bizimle iletişime geçin.",
    primaryButton: { text: "Teklif Oluştur", href: "/cart" },
    secondaryButton: { text: "İletişime Geç", href: "mailto:info@svdambalaj.com" },
  };

  const trustBadges = landingContent?.trustBadges ?? [
    { icon: "🏭", text: "1998'den Beri" },
    { icon: "🌍", text: "24 Ülkeye İhracat" },
    { icon: "✅", text: "ISO 9001:2015" },
    { icon: "🔒", text: "Güvenli Ödeme" },
    { icon: "📞", text: "7/24 Destek" },
  ];

  const sections = landingContent?.sections ?? {
    categoriesTitle: "Kategoriler",
    categoriesSubtitle: "İhtiyacınıza uygun ürünleri keşfedin",
    productsTitle: "Öne Çıkan Ürünler",
    productsSubtitle: "En çok tercih edilen ürünlerimiz",
  };

  // Featured products - filter by IDs or use first 8
  const featuredProductIds = landingContent?.featuredProducts ?? [];
  const featuredProducts = featuredProductIds.length > 0
    ? featuredProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined)
    : products.slice(0, 8);

  // Section order - default order if not set (advantages removed - already shown in hero/howItWorks)
  const sectionOrder = landingContent?.sectionOrder ?? [
    "hero", "categories", "howItWorks", "products", "cta", "trustBadges"
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
              <div className="flex flex-wrap gap-3">
                <Link
                  href={hero.primaryButton.href}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
                >
                  {hero.primaryButton.text}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href={hero.secondaryButton.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  {hero.secondaryButton.text}
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
                {hero.stats.map((stat, index) => (
                  <div key={index}>
                    <span className="text-2xl font-bold text-amber-400">{stat.value}</span>
                    <span className="ml-2 text-slate-400">{stat.label}</span>
                  </div>
                ))}
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
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
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
    ),
    // advantages section removed - already shown in other sections
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
                    loading="lazy"
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
    ),
    howItWorks: (
      <section key="howItWorks" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">{howItWorks.title}</h2>
            <p className="mt-2 text-slate-600">{howItWorks.subtitle}</p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {howItWorks.cards.map((card, index) => {
              const colorClasses: Record<string, { border: string; bg: string; icon: string; text: string; example: string }> = {
                amber: { border: 'border-amber-200', bg: 'from-amber-50', icon: 'bg-amber-500', text: 'text-amber-600', example: 'bg-amber-100/50 text-amber-800' },
                blue: { border: 'border-blue-200', bg: 'from-blue-50', icon: 'bg-blue-500', text: 'text-blue-600', example: 'bg-blue-100/50 text-blue-800' },
                green: { border: 'border-green-200', bg: 'from-green-50', icon: 'bg-green-500', text: 'text-green-600', example: 'bg-green-100/50 text-green-800' },
                purple: { border: 'border-purple-200', bg: 'from-purple-50', icon: 'bg-purple-500', text: 'text-purple-600', example: 'bg-purple-100/50 text-purple-800' },
                red: { border: 'border-red-200', bg: 'from-red-50', icon: 'bg-red-500', text: 'text-red-600', example: 'bg-red-100/50 text-red-800' },
              };
              const colors = colorClasses[card.color] ?? colorClasses.amber;

              return (
                <div key={index} className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} to-white p-6 shadow-sm`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon} text-2xl text-white`}>
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{card.title}</h3>
                      <p className={`text-sm ${colors.text} font-semibold`}>{card.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>{card.description}</p>
                    {card.example && (
                      <div className={`rounded-lg ${colors.example} p-3`}>
                        <p className="text-xs">
                          <strong>Örnek:</strong> {card.example}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                Ürünler yükleniyor...
              </div>
            )}

            {featuredProducts.map((product) => (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-amber-300 hover:shadow-lg"
              >
                <Link href={`/products/${product.slug}`} className="relative h-52 w-full overflow-hidden bg-slate-50">
                  <Image
                    src={resolveProductImage(product)}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-2 transition duration-300 group-hover:scale-105"
                    loading="lazy"
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
    ),
    cta: (
      <section key="cta" className="bg-gradient-to-r from-amber-500 to-amber-600 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
            <div>
              <h2 className="text-2xl font-bold">{cta.title}</h2>
              <p className="mt-2 text-amber-100">
                {cta.description}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={cta.primaryButton.href}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-amber-600 shadow-lg transition hover:bg-amber-50"
              >
                {cta.primaryButton.text}
              </Link>
              <a
                href={cta.secondaryButton.href}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                {cta.secondaryButton.text}
              </a>
            </div>
          </div>
        </div>
      </section>
    ),
    trustBadges: (
      <section key="trustBadges" className="border-t border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center text-sm text-slate-600">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-lg">{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
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
