import Image from "next/image";
import Link from "next/link";
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

  // Advantages - admin'den gelen veya varsayılan (howItWorks ile benzer bilgiler içerir)
  const advantages = landingContent?.advantages ?? [
    { icon: "🔄", title: "Kombo İndirimi", description: "Başlık + Şişe birlikte alana indirim", highlight: "%10" },
    { icon: "📦", title: "Toplu Alım Avantajı", description: "Adet arttıkça birim fiyat düşer", highlight: "Kademeli" },
    { icon: "🚚", title: "Ücretsiz Kargo", description: "50.000+ adet üzerinde ücretsiz", highlight: "Ücretsiz" },
    { icon: "💳", title: "Güvenli Ödeme", description: "Kredi kartı ve havale ile ödeme", highlight: "3D Secure" },
  ];

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

  // Featured products - filter by IDs or use first 4
  const featuredProductIds = landingContent?.featuredProducts ?? [];
  const featuredProducts = featuredProductIds.length > 0
    ? featuredProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined)
    : products.slice(0, 4);

  // Section order - default order if not set (admin ile senkronize, cta ve trustBadges varsayılandan çıkarıldı)
  const sectionOrder = landingContent?.sectionOrder ?? [
    "hero", "advantages", "categories", "howItWorks", "products"
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
            <div className="flex-1 relative h-[350px] lg:h-[450px] hidden sm:block overflow-hidden">
              {products.map((product, index) => {
                // Her ürün için benzersiz seed değerleri
                const seed1 = (index * 7919 + 13) % 101;
                const seed2 = (index * 6563 + 29) % 103;

                // Dinamik pozisyon hesaplama - tüm ürünler için
                // Grid benzeri dağılım ama rastgele ofsetlerle
                const gridCols = 5;
                const gridRows = Math.ceil(products.length / gridCols);
                const col = index % gridCols;
                const row = Math.floor(index / gridCols);

                // Temel pozisyonlar
                const baseLeft = (col / gridCols) * 85 + 5;
                const baseTop = (row / Math.max(gridRows, 4)) * 75 + 5;

                // Rastgele ofsetler
                const offsetX = ((seed1 / 101) - 0.5) * 12;
                const offsetY = ((seed2 / 103) - 0.5) * 12;

                const finalLeft = Math.max(0, Math.min(85, baseLeft + offsetX));
                const finalTop = Math.max(0, Math.min(80, baseTop + offsetY));

                // Boyut - rastgele ama dengeli
                const sizes = ['xs', 'sm', 'sm', 'md', 'md', 'lg'] as const;
                const sizeIndex = (seed1 + seed2) % sizes.length;
                const size = sizes[sizeIndex];

                // Boyut sınıfları
                const sizeClasses = {
                  xs: 'w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16',
                  sm: 'w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20',
                  md: 'w-18 h-18 sm:w-20 sm:h-20 lg:w-24 lg:h-24',
                  lg: 'w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28',
                };

                // Z-index - büyükler önde
                const zIndexMap = { xs: 10, sm: 15, md: 25, lg: 35 };
                const zIndex = zIndexMap[size] + (seed1 % 5);

                // Hafif rotasyon
                const rotate = ((seed1 / 101) - 0.5) * 15;

                // Yavaş animasyon
                const duration = 20 + (seed1 / 101) * 15;
                const delay = (seed2 / 103) * 8;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="absolute transition-all duration-700 hover:scale-125 hover:z-[60]"
                    style={{
                      top: `${finalTop}%`,
                      left: `${finalLeft}%`,
                      transform: `rotate(${rotate}deg)`,
                      animation: `slowFloat ${duration}s ease-in-out infinite`,
                      animationDelay: `${delay}s`,
                      zIndex,
                    }}
                    title={product.title}
                  >
                    <div className={`relative ${sizeClasses[size]} drop-shadow-[0_8px_25px_rgba(0,0,0,0.3)] hover:drop-shadow-[0_15px_40px_rgba(251,191,36,0.5)] transition-all duration-500`}>
                      <Image
                        src={resolveProductImage(product)}
                        alt={product.title}
                        fill
                        className="object-contain"
                        sizes="112px"
                        loading={index < 6 ? "eager" : "lazy"}
                      />
                    </div>
                  </Link>
                );
              })}

              {/* Soft glow efektleri */}
              <div className="absolute top-[25%] left-[30%] w-40 h-40 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-[20%] right-[20%] w-32 h-32 rounded-full bg-blue-400/8 blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
    ),
    advantages: (
      <section key="advantages" className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-4 sm:gap-6 lg:gap-8">
            {advantages.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                  <div className="text-xs font-bold text-amber-600">{item.highlight}</div>
                </div>
              </div>
            ))}
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
                .map(p => resolveProductImage(p))
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
      <section key="howItWorks" className="bg-gradient-to-b from-slate-900 to-slate-800 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-semibold text-amber-400 mb-4">
              Avantajlar
            </span>
            <h2 className="text-3xl font-bold text-white lg:text-4xl">{howItWorks.title}</h2>
            <p className="mt-3 text-lg text-slate-400">{howItWorks.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:gap-8 md:grid-cols-3">
            {howItWorks.cards.map((card, index) => {
              const colorClasses: Record<string, { gradient: string; iconBg: string; subtitleText: string; exampleBg: string; exampleText: string; border: string }> = {
                amber: { gradient: 'from-amber-500/10 to-amber-500/5', iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600', subtitleText: 'text-amber-400', exampleBg: 'bg-amber-500/10 border-amber-500/20', exampleText: 'text-amber-300', border: 'border-amber-500/20 hover:border-amber-500/40' },
                blue: { gradient: 'from-blue-500/10 to-blue-500/5', iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600', subtitleText: 'text-blue-400', exampleBg: 'bg-blue-500/10 border-blue-500/20', exampleText: 'text-blue-300', border: 'border-blue-500/20 hover:border-blue-500/40' },
                green: { gradient: 'from-emerald-500/10 to-emerald-500/5', iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600', subtitleText: 'text-emerald-400', exampleBg: 'bg-emerald-500/10 border-emerald-500/20', exampleText: 'text-emerald-300', border: 'border-emerald-500/20 hover:border-emerald-500/40' },
                purple: { gradient: 'from-purple-500/10 to-purple-500/5', iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600', subtitleText: 'text-purple-400', exampleBg: 'bg-purple-500/10 border-purple-500/20', exampleText: 'text-purple-300', border: 'border-purple-500/20 hover:border-purple-500/40' },
                red: { gradient: 'from-red-500/10 to-red-500/5', iconBg: 'bg-gradient-to-br from-red-400 to-red-600', subtitleText: 'text-red-400', exampleBg: 'bg-red-500/10 border-red-500/20', exampleText: 'text-red-300', border: 'border-red-500/20 hover:border-red-500/40' },
              };
              const colors = colorClasses[card.color] ?? colorClasses.amber;

              // SVG icons based on card type/index
              const icons = [
                // Kombo İndirimi - Link/Chain icon
                <svg key="combo" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>,
                // Kademeli Fiyat - Trending down/chart icon
                <svg key="bulk" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>,
                // Kargo - Truck icon
                <svg key="shipping" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>,
              ];

              return (
                <div
                  key={index}
                  className={`group relative rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.gradient} backdrop-blur-sm p-6 lg:p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20`}
                >
                  {/* Icon */}
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${colors.iconBg} shadow-lg mb-5`}>
                    {icons[index] || icons[0]}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                  <p className={`text-sm font-semibold ${colors.subtitleText} mb-4`}>{card.subtitle}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>

                  {/* Example */}
                  {card.example && (
                    <div className={`mt-5 rounded-xl border ${colors.exampleBg} p-4`}>
                      <p className={`text-xs ${colors.exampleText}`}>
                        <span className="font-semibold">Örnek:</span> {card.example}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Döviz Kuru Bilgisi */}
          {exchangeRate && (
            <div className="mt-10 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-slate-700 bg-slate-800/50 backdrop-blur-sm px-6 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                  <span className="text-amber-400 text-sm">$</span>
                </div>
                <p className="text-sm text-slate-400">
                  Fiyatlar USD bazlı, TCMB kuru ile TL&apos;ye çevrilir
                </p>
                <div className="h-4 w-px bg-slate-700" />
                <span className="font-bold text-white">
                  $1 = ₺{exchangeRate.rate.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">
                  ({new Date(exchangeRate.effectiveDate).toLocaleDateString("tr-TR")})
                </span>
              </div>
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

          <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {featuredProducts.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                Ürünler yükleniyor...
              </div>
            )}

            {featuredProducts.map((product) => {
              // En düşük fiyatı hesapla (bulk pricing varsa en düşük tier fiyatı)
              const lowestPriceUSD = product.bulkPricingUSD && product.bulkPricingUSD.length > 0
                ? Math.min(...product.bulkPricingUSD.map(t => t.price))
                : product.priceUSD;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-amber-300 hover:shadow-lg"
                >
                  {/* Compact Image */}
                  <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-gradient-to-br from-slate-300 via-slate-200 to-blue-100">
                    <Image
                      src={resolveProductImage(product)}
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

                    {/* Price with lowest price indicator */}
                    <div className="mt-auto pt-2">
                      {lowestPriceUSD && exchangeRate ? (
                        <>
                          <p className="text-sm sm:text-base font-bold text-amber-600">
                            {formatDualPrice(lowestPriceUSD, exchangeRate.rate, true)}
                            <span className="ml-0.5 text-[10px] font-normal text-slate-400">+KDV</span>
                          </p>
                          {product.bulkPricingUSD && product.bulkPricingUSD.length > 0 && lowestPriceUSD !== product.priceUSD && (
                            <p className="text-[10px] text-green-600 font-medium">
                              ↓ En düşük fiyat
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
