import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { resolveServerApiUrl, resolveServerApiBase } from "@/lib/server-api";
import { formatDualPrice, type ExchangeRate } from "@/lib/currency";

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
        next: { revalidate: 120 },
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
      next: { revalidate: 300 },
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
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Ürün bulunamadı | SVD Ambalaj",
    };
  }

  return {
    title: `${product.title} | SVD Ambalaj`,
    description: product.description,
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {galleryImages.map((image, index) => (
                <div
                  key={`${product.id}-image-${index}`}
                  className="relative h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                >
                  <Image
                    src={image}
                    alt={`${product.title} görsel ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

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
              <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
                <p className="mb-4 text-lg font-semibold text-amber-900">
                  {product.packageInfo ? 'Koli Bazlı Fiyatlandırma' : 'Adet Bazlı Fiyatlandırma'}
                </p>
                {product.packageInfo ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-amber-200 text-left">
                          <th className="pb-3 font-semibold text-slate-700">Koli Adedi</th>
                          <th className="pb-3 font-semibold text-slate-700">Toplam Ürün</th>
                          <th className="pb-3 font-semibold text-slate-700">Birim Fiyat</th>
                          <th className="pb-3 text-right font-semibold text-slate-700">Koli Fiyatı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-amber-50">
                          <td className="py-3 font-medium text-amber-900">
                            1-{(product.bulkPricingUSD && product.bulkPricingUSD[0]) ? (product.bulkPricingUSD[0].minQty - 1) : '∞'} koli
                          </td>
                          <td className="py-3 text-slate-600">
                            {product.packageInfo.itemsPerBox}-{(product.bulkPricingUSD && product.bulkPricingUSD[0]) ? ((product.bulkPricingUSD[0].minQty - 1) * product.packageInfo.itemsPerBox) : '∞'} adet
                          </td>
                          <td className="py-3 font-semibold text-slate-900">
                            {product.priceUSD && exchangeRate
                              ? formatDualPrice(product.priceUSD, exchangeRate.rate, true)
                              : 'Fiyat için iletişime geçin'}
                          </td>
                          <td className="py-3 text-right font-bold text-amber-600">
                            {product.priceUSD && exchangeRate
                              ? formatDualPrice(product.priceUSD * product.packageInfo.itemsPerBox, exchangeRate.rate, true)
                              : '—'}
                          </td>
                        </tr>
                        {(product.bulkPricingUSD ?? [])?.map((tier, index) => {
                          const bulkList = product.bulkPricingUSD;
                          const nextTier = bulkList?.[index + 1];
                          const maxQty = nextTier ? nextTier.minQty - 1 : null;
                          const totalItems = tier.minQty * product.packageInfo!.itemsPerBox;
                          const totalItemsFormatted = totalItems.toLocaleString('tr-TR');
                          return (
                            <tr key={`tier-${tier.minQty}`} className="hover:bg-amber-50">
                              <td className="py-3 font-medium text-amber-900">
                                {tier.minQty}{maxQty ? `-${maxQty}` : '+'} koli
                                <br />
                                <span className="text-xs text-slate-500">
                                  ({totalItemsFormatted}{maxQty ? `-${(maxQty * product.packageInfo!.itemsPerBox).toLocaleString('tr-TR')}` : '+'} adet)
                                </span>
                              </td>
                              <td className="py-3 text-slate-600">
                                {tier.minQty * product.packageInfo!.itemsPerBox}
                                {maxQty ? `-${maxQty * product.packageInfo!.itemsPerBox}` : '+'} adet
                              </td>
                              <td className="py-3 font-semibold text-slate-900">
                                {product.bulkPricingUSD && exchangeRate
                                  ? formatDualPrice(tier.price, exchangeRate.rate, true)
                                  : '—'}
                              </td>
                              <td className="py-3 text-right font-bold text-amber-600">
                                {product.bulkPricingUSD && exchangeRate
                                  ? formatDualPrice(tier.price * product.packageInfo!.itemsPerBox, exchangeRate.rate, true)
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm text-amber-800">
                    <li className="flex items-center justify-between">
                      <span>1+ adet</span>
                      <span className="font-semibold">
                        {product.priceUSD && exchangeRate
                          ? formatDualPrice(product.priceUSD, exchangeRate.rate, true)
                          : 'Fiyat için iletişime geçin'}
                      </span>
                    </li>
                    {(product.bulkPricingUSD ?? []).map((tier) => (
                      <li key={`${product.id}-tier-${tier.minQty}`} className="flex items-center justify-between">
                        <span>{tier.minQty}+ adet</span>
                        <span className="font-semibold">
                          {product.bulkPricingUSD && exchangeRate
                            ? formatDualPrice(tier.price, exchangeRate.rate, true)
                            : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Teknik Özellikler</h2>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {product.packageInfo && (
                      <li>• <strong>Paket bilgisi:</strong> {product.packageInfo.itemsPerBox} adet/{product.packageInfo.boxLabel.toLowerCase()}</li>
                    )}
                    {product.stock && product.stock > 0 && product.packageInfo && (
                      <li>• <strong>Stok durumu:</strong> {Math.floor(product.stock / product.packageInfo.itemsPerBox)} {product.packageInfo.boxLabel.toLowerCase()} ({product.stock} adet)</li>
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

            <AddToCartButton
              product={{
                id: product.id,
                title: product.title,
                slug: product.slug,
                price: tryUnitPrice || 0,
                bulkPricing: tryBulkPricing,
                packageInfo: product.packageInfo,
                specifications: product.specifications,
              }}
              variant="primary"
              className="w-full"
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
      </div>
    </main>
  );
}
