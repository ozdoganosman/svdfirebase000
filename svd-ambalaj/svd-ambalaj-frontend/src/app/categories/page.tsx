import type { Metadata } from "next";
import Image from "next/image";
import { resolveServerApiUrl, resolveServerApiOrigin } from "@/lib/server-api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spreyvalfdunyasi.com";

export const metadata: Metadata = {
  title: "Kategoriler",
  description: "Sprey valf, pompa başlık, pet şişe ve ambalaj kategorileri. İhtiyacınıza uygun ürünleri kolayca bulun.",
  keywords: ["sprey kategorileri", "ambalaj kategorileri", "ürün kategorileri"],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${siteUrl}/categories`,
    siteName: "Sprey Valf Dünyası",
    title: "Ürün Kategorileri | Sprey Valf Dünyası",
    description: "Sprey valf, pompa başlık, pet şişe ve ambalaj kategorileri. İhtiyacınıza uygun ürünleri kolayca bulun.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Sprey Valf Dünyası Kategorileri" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ürün Kategorileri | Sprey Valf Dünyası",
    description: "Sprey valf, pompa başlık, pet şişe ve ambalaj kategorileri.",
  },
  alternates: {
    canonical: `${siteUrl}/categories`,
  },
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productType?: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  category?: string;
  images?: string[];
  image?: string;
};

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(resolveServerApiUrl("/categories"), {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      console.error("Failed to fetch categories", response.statusText);
      return [];
    }

    const payload = await response.json();
    return payload?.categories ?? [];
  } catch (error) {
    console.error("Category fetch error", error);
    return [];
  }
}

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(resolveServerApiUrl("/products"), {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      console.error("Failed to fetch products", response.statusText);
      return [];
    }

    const payload = await response.json();
    return payload?.products ?? [];
  } catch (error) {
    console.error("Product fetch error", error);
    return [];
  }
}

// Resolve product image path
function resolveProductImage(product: Product): string {
  const apiOrigin = resolveServerApiOrigin();
  const img = product.images?.[0] || product.image;
  if (!img) return "/images/placeholders/product.jpg";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/")) return `${apiOrigin}${img}`;
  return `${apiOrigin}/${img}`;
}

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-white py-12 sm:py-20 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-5 py-2.5 text-sm font-semibold text-amber-700 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Ürün Kategorileri
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Ambalaj Çözümlerimizi Keşfedin
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Sprey valf, pompa başlık, pet şişe ve daha fazlası. Profesyonel ambalaj ihtiyaçlarınız için
            <span className="text-amber-600 font-medium"> toptan fiyat avantajlarından </span>
            yararlanın.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length === 0 && (
            <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-slate-500 text-lg">Şu anda listelenecek kategori bulunamadı.</p>
              <p className="text-slate-400 text-sm mt-1">Lütfen daha sonra tekrar deneyin.</p>
            </div>
          )}

          {categories.map((category) => {
            // Bu kategorideki ürünleri bul
            const categoryProducts = products.filter(p => p.category === category.id);
            const productImages = categoryProducts
              .slice(0, 4)
              .map(p => resolveProductImage(p))
              .filter(Boolean);

            return (
              <a
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300"
              >
                {/* Image Container - Ürün görselleri grid */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-300 via-slate-200 to-blue-100">
                  {productImages.length >= 4 ? (
                    // 4 ürün varsa 2x2 grid
                    <div className="grid grid-cols-2 grid-rows-2 h-full">
                      {productImages.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="relative overflow-hidden">
                          <Image
                            src={img}
                            alt={categoryProducts[idx]?.title || category.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
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
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
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
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : category.image ? (
                    // Kategori görseli (fallback)
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    // Placeholder
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-20 h-20 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Product Type Badge */}
                  {category.productType && (
                    <span className="absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                      {category.productType === "başlık" && "Başlık"}
                      {category.productType === "şişe" && "Şişe"}
                      {category.productType === "nötr" && "Aksesuar"}
                      {!["başlık", "şişe", "nötr"].includes(category.productType) && category.productType}
                    </span>
                  )}

                  {/* Ürün sayısı badge */}
                  {categoryProducts.length > 0 && (
                    <span className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                      {categoryProducts.length} ürün
                    </span>
                  )}

                  {/* Hover CTA */}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <span className="inline-flex items-center justify-center w-full gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg">
                      Ürünleri Görüntüle
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4 sm:p-5">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-600 group-hover:text-amber-700 flex items-center gap-1">
                      Kategoriyi İncele
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50">
            <div className="text-left">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Toptan Sipariş Avantajı</h3>
              <p className="mt-1 text-sm text-slate-600">Yüksek adetlerde özel fiyatlardan yararlanın</p>
            </div>
            <a
              href="/checkout"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Hızlı Teklif Al
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
