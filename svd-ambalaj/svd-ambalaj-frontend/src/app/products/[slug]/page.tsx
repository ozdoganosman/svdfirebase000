import type { Metadata } from "next";
import Link from "next/link";
import { ProductWithVariants } from "@/components/product-with-variants";
import { ImageGallery } from "@/components/image-gallery";
import { resolveServerApiUrl, resolveServerApiBase } from "@/lib/server-api";
import { formatDualPrice, type ExchangeRate } from "@/lib/currency";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { RelatedProducts } from "@/components/related-products";

type BulkTier = {
  minQty: number;
  price: number;
};

type VariantOption = {
  id: string;
  name: string;
  stock: number;
  priceModifier: number;
};

type VariantSegment = {
  id: string;
  name: string;
  required: boolean;
  options: VariantOption[];
};

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  priceUSD?: number;
  bulkPricing?: BulkTier[];
  bulkPricingUSD?: BulkTier[];
  category: string;
  images?: string[];
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
  variants?: VariantSegment[];
  hasVariants?: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

async function getProduct(slug: string): Promise<Product | undefined> {
  try {
    const response = await fetch(
      resolveServerApiUrl(`/products/slug/${slug}`),
      {
        next: { revalidate: 10 }, // Short cache for quick updates
      }
    );
    if (!response.ok) {
      return undefined;
    }
    const data = await response.json();
    return data?.product ?? data;
  } catch (error) {
    console.error("Product fetch error", error);
    return undefined;
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(resolveServerApiUrl("/categories"), {
      next: { revalidate: 60 }, // 1 minute cache
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

async function getExchangeRate(): Promise<ExchangeRate | null> {
  try {
    const apiBase = resolveServerApiBase();
    const response = await fetch(`${apiBase}/exchange-rate`, {
      next: { revalidate: 60 }, // 1 minute cache
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spreyvalfdunyasi.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Ürün bulunamadı",
    };
  }

  const productImage = product.images?.[0] || "/og-image.jpg";
  const productUrl = `${siteUrl}/products/${slug}`;
  const description = product.description?.slice(0, 160) || `${product.title} - Toptan fiyatlarla satışta. Hızlı teslimat, uygun fiyat.`;

  return {
    title: product.title,
    description,
    keywords: [
      product.title,
      "sprey valf",
      "ambalaj",
      product.specifications?.neckSize ? `${product.specifications.neckSize} ağız` : "",
      product.specifications?.volume || "",
    ].filter(Boolean),
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: productUrl,
      siteName: "Sprey Valf Dünyası",
      title: product.title,
      description,
      images: [
        {
          url: productImage,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: [productImage],
    },
    alternates: {
      canonical: productUrl,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, categories, exchangeRate] = await Promise.all([
    getProduct(slug),
    getCategories(),
    getExchangeRate(),
  ]);

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 py-20 text-slate-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-bold">Ürün bulunamadı</h1>
          <p className="mt-4 text-slate-600">
            Aradığınız ürün kaldırılmış olabilir. Tüm ürünlerimizi görmek için
            <Link href="/products" className="font-semibold text-amber-600 hover:underline">
              {" "}ürün listesine geri dönün.
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const category = categories.find((item) => item.id === product.category);

  // Compute TRY prices from USD for cart interactions
  const rate = exchangeRate?.rate ?? 0;
  const tryUnitPrice = product.priceUSD && rate > 0 ? product.priceUSD * rate : 0;
  const tryBulkPricing = (product.priceUSD && product.bulkPricingUSD && rate > 0)
    ? product.bulkPricingUSD.map((tier) => ({ minQty: tier.minQty, price: tier.price * rate }))
    : undefined;

  const galleryImages = product.images && product.images.length > 0
    ? product.images
    : ["/images/placeholders/product.jpg"];

  const breadcrumbItems = [
    { name: "Ana Sayfa", url: "/" },
    { name: "Ürünler", url: "/products" },
    ...(category ? [{ name: category.name, url: `/categories/${category.slug}` }] : []),
    { name: product.title, url: `/products/${slug}` },
  ];

  return (
    <>
      <ProductViewTracker
        productId={product.id}
        productName={product.title}
        price={tryUnitPrice || 0}
      />
      <ProductJsonLd
        name={product.title}
        description={product.description}
        image={galleryImages[0]}
        slug={slug}
        price={tryUnitPrice || undefined}
        priceCurrency="TRY"
        availability={product.stock && product.stock > 0 ? "InStock" : "OutOfStock"}
        category={category?.name}
        bulkPricing={tryBulkPricing}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <section className="space-y-6">
            {/* Image Gallery with Lightbox */}
            <ImageGallery images={galleryImages} productTitle={product.title} />

            <article className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
              <header className="space-y-3">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                  {category ? category.name : "Ambalaj Çözümleri"}
                </span>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                  {product.title}
                </h1>
                <p className="text-lg text-slate-600">{product.description}</p>
              </header>

              {/* KOLI BILGISI KARTI */}
              {product.packageInfo && (
                <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-amber-900">
                    <span className="text-2xl">📦</span>
                    Koli Satış Bilgileri
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Koli İçi Adet</p>
                      <p className="mt-1 text-3xl font-bold text-amber-900">
                        {product.packageInfo.itemsPerBox}
                      </p>
                      <p className="text-xs text-slate-600">adet/{product.packageInfo.boxLabel.toLowerCase()}</p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Paket Türü</p>
                      <p className="mt-1 text-3xl font-bold text-amber-900">
                        {product.packageInfo.boxLabel}
                      </p>
                      <p className="text-xs text-slate-600">bazlı satış</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-amber-200/50 p-3 text-sm text-amber-900">
                    <strong>💡 Not:</strong> Bu ürün sadece tam {product.packageInfo.boxLabel.toLowerCase()} olarak satılır. 
                    1 {product.packageInfo.boxLabel.toLowerCase()} = {product.packageInfo.itemsPerBox} adet ürün içerir.
                  </div>
                </div>
              )}

              {/* KOLI BAZLI FIYATLANDIRMA TABLOSU */}
              {product.packageInfo && (product.bulkPricingUSD?.length ?? 0) > 0 && (
                <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-green-800">
                    <span className="text-xl">💰</span>
                    Toplu Alım İndirimi
                  </h3>
                  <div className="space-y-3">
                    {/* Normal fiyat */}
                    <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                      <div>
                        <span className="font-medium text-slate-700">1-{(product.bulkPricingUSD?.[0]?.minQty ?? 2) - 1} koli</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-900">
                          {product.priceUSD && exchangeRate
                            ? `$${product.priceUSD.toFixed(3)}`
                            : '—'}
                        </span>
                        <span className="ml-2 text-sm text-slate-500">/ adet</span>
                      </div>
                    </div>
                    {/* Bulk tiers */}
                    {(product.bulkPricingUSD ?? []).map((tier, index) => {
                      const nextTier = product.bulkPricingUSD?.[index + 1];
                      const isLast = !nextTier;
                      const discount = product.priceUSD ? Math.round((1 - tier.price / product.priceUSD) * 100) : 0;
                      return (
                        <div key={`tier-${tier.minQty}`} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-700">
                              {tier.minQty}{isLast ? '+' : `-${(nextTier?.minQty ?? tier.minQty) - 1}`} koli
                            </span>
                            {discount > 0 && (
                              <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                                %{discount} indirim
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-600">
                              ${tier.price.toFixed(3)}
                            </span>
                            <span className="ml-2 text-sm text-slate-500">/ adet</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-xs text-green-700">
                    * Fiyatlar USD cinsindendir. Sipariş sırasında güncel kurla TL&apos;ye çevrilir.
                  </p>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Teknik Özellikler</h2>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {product.packageInfo && (
                      <li>• <strong>Paket bilgisi:</strong> {product.packageInfo.itemsPerBox} adet/{product.packageInfo.boxLabel.toLowerCase()}</li>
                    )}
                    {product.stock && product.stock > 0 && product.packageInfo && (
                      <li>• <strong>Stok durumu:</strong> {product.stock} {product.packageInfo.boxLabel.toLowerCase()} ({(product.stock * product.packageInfo.itemsPerBox).toLocaleString('tr-TR')} adet)</li>
                    )}
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
                    <li>• Teslimat süresi: 3-5 iş günü stoktan, 10-15 iş günü ithal ürünlerde</li>
                    <li>• Sertifika: ISO 9001 üretim tesisi</li>
                  </ul>
                </div>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Kullanım Alanları</h2>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Kozmetik: Tonik, saç spreyi, losyon</li>
                    <li>• Ev bakım: Yüzey temizleyici, oda spreyi</li>
                    <li>• Sağlık: Antiseptik ve dezenfektan çözeltiler</li>
                    <li>• Endüstriyel kullanımda dayanıklı yapı</li>
                  </ul>
                </div>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Numune ve Özelleştirme</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Bu ürün için renk, dip boru uzunluğu ve baskı seçeneklerinde özelleştirme yapılabilir. Numune talep etmek için
                  <Link href="/#sample" className="font-semibold text-amber-600 hover:underline">
                    {" "}numune formunu doldurun
                  </Link>
                  . Müşteri temsilcilerimiz 24 saat içinde dönüş yapacaktır.
                </p>
              </section>
            </article>
          </section>

            <aside className="flex h-fit flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {product.packageInfo ? 'Birim Fiyat' : 'Başlangıç Fiyatı'}
              </p>
              <p className="text-4xl font-bold text-amber-600">
                {product.priceUSD && exchangeRate
                  ? formatDualPrice(product.priceUSD, exchangeRate.rate, true)
                  : 'Fiyat için iletişime geçin'}
              </p>
              {product.packageInfo ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-slate-700">
                    1 {product.packageInfo.boxLabel} = {
                      product.priceUSD && exchangeRate
                        ? formatDualPrice(product.priceUSD * product.packageInfo.itemsPerBox, exchangeRate.rate, true)
                        : '—'
                    }
                  </p>
                  <p className="text-xs text-slate-500">
                    ({product.packageInfo.itemsPerBox} adet × {
                      product.priceUSD && exchangeRate
                        ? formatDualPrice(product.priceUSD, exchangeRate.rate, true)
                        : '—'
                    })
                  </p>
                  {(product.bulkPricingUSD) && (product.bulkPricingUSD?.length || 0) > 0 && (
                    <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                      🎉 {product.bulkPricingUSD![product.bulkPricingUSD!.length - 1].minQty}+ koli alımında{' '}
                      {product.bulkPricingUSD && exchangeRate
                        ? formatDualPrice((product.bulkPricingUSD)[product.bulkPricingUSD.length - 1].price, exchangeRate.rate, true)
                        : '—'} birim fiyat!
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  Fiyatlar adet bazlı olup toplu alımlarda otomatik güncellenir.
                </p>
              )}
            </div>

            <ProductWithVariants
              product={{
                id: product.id,
                title: product.title,
                slug: product.slug,
                price: tryUnitPrice || 0,
                bulkPricing: tryBulkPricing,
                packageInfo: product.packageInfo,
                specifications: product.specifications,
                variants: product.variants,
                hasVariants: product.hasVariants,
                images: product.images,
              }}
            />

            <a
              href="mailto:info@svdambalaj.com"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600"
            >
              Teklif iste
            </a>
            <Link
              href="/#sample"
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-white px-6 py-3 text-sm font-semibold text-amber-600 shadow-sm shadow-amber-200/50 transition hover:border-amber-400 hover:bg-amber-50"
            >
              Numune talep et
            </Link>
          </aside>
        </div>

        {/* Related Products */}
        <RelatedProducts
          currentProductId={product.id}
          categoryId={product.category}
          apiBase={resolveServerApiBase()}
          exchangeRate={rate}
        />
      </div>
    </main>
    </>
  );
}
