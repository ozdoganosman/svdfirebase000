import Image from "next/image";
import Link from "next/link";
import { SampleRequestForm } from "@/components/sample-request-form";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { LandingVideoSection } from "@/components/landing-video-section";
import { LandingGallerySection } from "@/components/landing-gallery-section";
import {
  resolveServerApiBase,
  resolveServerApiOrigin,
} from "@/lib/server-api";
import { formatDualPrice, type ExchangeRate } from "@/lib/currency";

// Force dynamic rendering to always fetch fresh landing media
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value);

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
      next: { revalidate: 300 }, // 5 dakika cache
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
    // If it's already a full URL (http:// or https://), return it as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // If it's a relative path starting with /uploads/ and we have an API origin, prepend it
    if (path.startsWith('/uploads/') && apiOrigin) {
      return `${apiOrigin}${path}`;
    }
    return path;
  };

  const resolveProductImage = (product: Product): string =>
    resolveMediaPath(product.images?.[0] ?? product.image) || '/images/placeholders/product.jpg';

  const [products, categories, exchangeRate, landingMediaPayload] = await Promise.all([
    getProducts(apiBase),
    getCategories(apiBase),
    getExchangeRate(apiBase),
    fetch(`${apiBase}/landing-media`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Landing media request failed: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error('Failed to load landing media', error);
        return { landingMedia: null };
      }),
  ]);

  const landingMedia = landingMediaPayload?.landingMedia;
  
  // DEBUG: Server-side log to verify data
  console.log('[SERVER] Landing media heroVideo:', JSON.stringify(landingMedia?.heroVideo));

  const landingGallery: string[] = Array.isArray(landingMedia?.heroGallery) && landingMedia.heroGallery.length > 0
    ? landingMedia.heroGallery
    : [
        '/images/landing/24.png',
        '/images/landing/25.png',
        '/images/landing/27.png',
        '/images/landing/28.png',
      ];

  const resolvedLandingGallery = landingGallery.map((item: string) => resolveMediaPath(item) || item);

  const heroImage = resolvedLandingGallery[0] ?? '/images/products/mist-sprey-24-410.jpg';
  const heroOverlayImages = resolvedLandingGallery.slice(1);
  const heroCycleDuration = 20;

  const capabilities = [
    {
      title: 'Kalıp ve Tasarım Desteği',
      description:
        'Markanıza özel kalıp geliştirme, renk uyumu ve yüzey işlemleri için AR-GE ekibimiz ışık hızında çözüm sunar.',
    },
    {
      title: 'Dolum Hattı Uyum Testleri',
      description:
        'Trigger, mist ve köpük pompalarımızı talep ettiğiniz dolum hatlarında test eder, performans raporunu sizinle paylaşırız.',
    },
    {
      title: 'Sürdürülebilir Malzeme Seçenekleri',
      description:
        'Geri dönüştürülebilir PP, PET ve bio-bazlı hammaddelerle üretim yaparak çevresel ayak izinizi azaltmanıza yardımcı oluyoruz.',
    },
    {
      title: 'Küresel Lojistik Ağı',
      description:
        'İstanbul ve Şanghay depolarımızdan haftalık parsiyel ve konteyner sevkiyatları ile Avrupa ve MENA’ya kesintisiz teslimat.',
    },
  ];

  const processSteps = [
    {
      step: '1',
      title: 'İhtiyaç Analizi',
      description: 'Üretim hattınız ve hedef pazarınız için ürün-spesifik gereksinimleri dinliyoruz.',
    },
    {
      step: '2',
      title: 'Numune & Pilot Üretim',
      description: 'Seçilen sprey veya pompa için numune gönderimi ve pilot üretim gerçekleştiriyoruz.',
    },
    {
      step: '3',
      title: 'Kalite Onayı',
      description: 'IPQC kontrolleri ve tork, sızıntı, atomizasyon testleri tamamlanır, raporlanır.',
    },
    {
      step: '4',
      title: 'Sevkiyat & Süreç Takibi',
      description: 'Ürünleriniz paketlenir, lojistik departmanımız konteyner hareketlerini anlık paylaşır.',
    },
  ];

  const certifications = [
    { label: 'ISO 9001:2015', description: 'Kalite yönetim sistemi ile süreç kontrolü' },
    { label: 'GMP Standartları', description: 'Hijyenik üretim hatları ve izlenebilirlik' },
    { label: 'IFRA Uyumlu', description: 'Parfümeri ve kozmetik ürünlerinde güvenli kullanım' },
    { label: 'REACH & RoHS', description: 'AB pazarına uyumlu hammadde seçimi' },
  ];

  const testimonials = [
    {
      quote:
        'Yeni ürün lansmanımızda SVD ekibinin sağladığı hızlı numune süreci ve üretim planlaması sayesinde 6 haftada raflara çıktık.',
      author: 'Burcu K., Kozmetik Marka Yöneticisi',
    },
    {
      quote:
        'Trigger spreylerde tork ve sızıntı testlerinin video raporlarını almamız karar süreçlerimizi hızlandırdı.',
      author: 'Serhat T., Temizlik Ürünleri Operasyon Müdürü',
    },
  ];

  const showcaseStats = [
    {
      label: 'Ürün çeşidi',
      value: products.length > 0 ? `${products.length}+` : '25+',
    },
    {
      label: 'Çözüm kategorisi',
      value: categories.length > 0 ? `${categories.length}` : '9',
    },
    {
      label: 'Yıllık sevkiyat kapasitesi',
      value: '50M+',
    },
    {
      label: 'İhracat edilen ülke',
      value: '24',
    },
  ];

  const features = [
    {
      title: 'SVD Üretim Gücü',
      description:
        'İstanbul ve Şanghay merkezli tedarik zincirimiz ile sprey başlık, pompa ve şişe üretimini aynı çatı altında topluyoruz. Her sevkiyat SVD kalite güvence süreçlerinden geçer.',
    },
    {
      title: 'Özel Kalıp ve Renk Opsiyonları',
      description:
        'Kozmetik, temizlik ve sağlık markalarına özel kalıp, renk ve logo baskı hizmetleri sunarak raflarda öne çıkmanızı sağlıyoruz.',
    },
    {
      title: 'Just-in-Time Lojistik',
      description:
        'İstanbul depomuzdan Türkiye geneline 24 saat içinde sevkiyat, Avrupa ve Orta Doğu’ya düzenli ihracat planlaması ile siparişlerinizi zamanında teslim ediyoruz.',
    },
    {
      title: 'B2B Dijital Altyapı',
      description:
        'Yetkilendirilmiş bayi ve distribütörleriniz için dinamik fiyat listeleri, kampanya yönetimi ve detaylı raporlama tek panelde.',
    },
  ];

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-20 sm:px-10 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
            SVD Ambalaj · 1998’den beri profesyonel ambalaj çözümleri
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Endüstriyel üretiminiz için{' '}
            <span className="text-amber-600"> güvenilir sprey ve pompa tedarik zinciri</span>
          </h1>
          <p className="text-lg text-slate-600 sm:max-w-xl">
            SVD Ambalaj olarak kozmetik, kişisel bakım, ev-deterjan ve otomotiv sektörleri için sprey valf, tetik pompa, köpük pompası ve PET ambalaj üretip ithal ediyoruz. Tüm ürünlerimiz kalite kontrollerinden geçer, siparişleriniz planlanan tarihte depolarınıza ulaşır.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#products"
              className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600"
            >
              Ürünleri İncele
            </a>
            <a
              href="mailto:info@svdambalaj.com"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600"
            >
              Teklif Talep Et
            </a>
            <a
              href="#sample"
              className="rounded-full border border-transparent bg-white px-6 py-3 text-sm font-semibold text-amber-600 shadow-sm shadow-amber-200/50 transition hover:border-amber-400 hover:bg-amber-50"
            >
              Numune Talep Et
            </a>
          </div>
        </div>
        <div className="relative flex-1">
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-900/5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
            <Image
              src={heroImage}
              alt="SVD Ambalaj üretimden çıkan sprey ve pompa çözümleri"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            />
            {heroOverlayImages.map((imageSrc: string, index: number) => (
              <Image
                key={imageSrc}
                src={imageSrc}
                alt={`SVD Ambalaj üretim görseli ${index + 2}`}
                fill
                className="object-cover hero-fade"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                style={{
                  animationDelay: `${(index + 1) * (heroCycleDuration / (heroOverlayImages.length + 1))}s`,
                  animationDuration: `${heroCycleDuration}s`,
                }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-6 text-white">
              <p className="text-sm uppercase tracking-widest text-amber-300">Saha tarafından</p>
              <h2 className="text-2xl font-semibold">Tam entegre dolum hattı uyumlu çözümler</h2>
              <ul className="space-y-1 text-sm text-slate-100/90">
                <li>• ISO 9001:2015 sertifikalı üretim ortakları</li>
                <li>• EN13432 uyumlu geri dönüştürülebilir ham madde opsiyonları</li>
                <li>• Markanıza özel UV veya tampon baskı seçeneği</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {showcaseStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-amber-100 bg-amber-50 px-6 py-8 text-center shadow-sm shadow-amber-200/50"
              >
                <p className="text-3xl font-bold text-amber-600">{stat.value}</p>
                <p className="mt-2 text-sm font-semibold text-amber-800">{stat.label}</p>
                {stat.label === 'Ürün çeşidi' && (
                  <Link
                    href="/products"
                    className="mt-4 inline-block text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    Tümünü Gör →
                  </Link>
                )}
                {stat.label === 'Çözüm kategorisi' && (
                  <Link
                    href="/categories"
                    className="mt-4 inline-block text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    Keşfet →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-6xl space-y-12 px-6 sm:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.3fr,0.7fr] lg:items-center">
            <LandingVideoSection fallbackPoster={heroImage} />
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold">Görsel ve video içeriklerle daha güçlü etkileşim</h2>
                <p className="text-slate-200">
                  Yüksek çözünürlüklü fotoğraflarınızı ve operasyon videolarınızı, potansiyel müşterilerinize üretim kalitenizi kanıtlamak için kullanın. Bu alan, ürün gamınızı ve süreçlerinizi sahadan görüntülerle sergilemeniz için hazır.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                  4K çözünürlüğe kadar video desteği ile showroom turu veya makine demoları yayınlayın.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Kademe kademe üretim fotoğraflarınızı müşterilerle paylaşarak güven yaratın.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Videoları altyazı ve bilgi etiketleriyle destekleyerek marka hikayenizi anlatın.
                </li>
              </ul>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                <p>
                  Kendi videonuzu eklemek için medya kütüphanesine MP4 formatında yükleyip URL’sini bu alandaki kaynağa bağlamanız yeterlidir. Poster alanına yüksek çözünürlüklü kapak görseli atayarak hızlı yüklenmesini sağlayabilirsiniz.
                </p>
              </div>
            </div>
          </div>

          <LandingGallerySection />
        </div>
      </section>

      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Çözüm Kategorilerimiz</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Mist sprey, köpük pompası, tetik sprey, sabun dozaj pompaları ve PET şişe çözümlerimizle yüksek hacimli dolum hatlarınızı destekliyoruz. Her kategori stoklu çalışır, ihracata hazırdır.
              </p>
            </div>
            <Link
              href="/categories"
              className="inline-flex items-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600"
            >
              Tüm Kategorileri Gör
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg"
              >
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  <img
                    src={resolveMediaPath(category.image) || "/images/placeholders/category.jpg"}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-4 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-amber-600">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {category.description ?? ''}
                  </p>
                  <span className="inline-flex items-center text-sm font-semibold text-amber-600">
                    İncele →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-slate-100">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">
              SVD Ambalaj’ın dijital satış kanalı ile operasyonlarınızı hızlandırın
            </h2>
            <p className="mt-4 text-slate-300">
              B2B bayi ağımız için geliştirdiğimiz platform, toplu siparişleri fiyat kademelerine göre yönetmenizi, stok seviyelerini takip etmenizi ve lojistik süreçlerinizi tek panelden planlamanızı sağlar.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 shadow-lg shadow-black/20">
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl space-y-8 px-6 sm:px-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900">Neden üretim partneri olarak SVD Ambalaj?</h2>
            <p className="mt-3 text-slate-600">
              Ölçeklenebilir üretim altyapımız ve küresel tedarik ağıyla, sprey ve pompa çözümlerinde uçtan uca hizmet sunuyoruz. Aşağıda öne çıkan kabiliyetlerimizi inceleyin.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-6xl space-y-10 px-6 sm:px-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">Siparişten sevkiyata kadar şeffaf süreç yönetimi</h2>
            <p className="mt-4 text-slate-300">
              Teklif talebinizden itibaren tüm aşamaları dijital olarak takip edebilirsiniz. Her adımda saha mühendislerimiz ve lojistik ekibimiz sizinle.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-lg font-semibold text-amber-200">
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-amber-50/80">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl space-y-8 px-6 sm:px-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900">Sertifikalar ve uyum belgeleri</h2>
            <p className="mt-3 text-slate-600">
              Ürünlerimiz uluslararası denetimlerden geçer, tüm hammaddelerimiz REACH ve RoHS uyumludur. Gerekli belgeleri teklif aşamasında paylaşabiliriz.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {certifications.map((cert) => (
              <div key={cert.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{cert.label}</h3>
                <p className="mt-2 text-sm text-slate-600">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-amber-50 py-16">
        <div className="mx-auto max-w-4xl space-y-8 px-6 text-center sm:px-10">
          <h2 className="text-3xl font-bold text-slate-900">Müşterilerimizden notlar</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {testimonials.map((item) => (
              <div key={item.author} className="rounded-2xl border border-amber-200 bg-white p-6 text-left shadow-sm">
                <p className="text-sm text-slate-700">“{item.quote}”</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-600">{item.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-500 to-amber-600 py-16 text-white">
        <div className="mx-auto max-w-5xl space-y-8 px-6 sm:px-10">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              💵 Fiyatlandırma Politikası
            </span>
            <h2 className="mt-4 text-3xl font-bold">USD Bazlı Fiyatlandırma Sistemi</h2>
            <p className="mt-3 text-lg text-amber-50">
              Şeffaf ve güncel fiyatlandırma için tüm ürünlerimiz dolar bazlı fiyatlandırılmaktadır
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">TCMB Efektif Satış Kuru</h3>
              <p className="text-sm text-amber-50">
                Fiyatlarımız T.C. Merkez Bankası&apos;nın günlük USD efektif satış kuru baz alınarak hesaplanır. Her gün saat 16:00&apos;da otomatik güncellenir.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Anlık Kur Gösterimi</h3>
              <p className="text-sm text-amber-50">
                Site üst başlığında anlık döviz kurunu görebilirsiniz. Tüm fiyatlar hem TL hem de USD olarak görüntülenir. Sepetiniz güncel kurla hesaplanır.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Döviz Dalgalanmalarından Korunma</h3>
              <p className="text-sm text-amber-50">
                USD bazlı fiyatlandırma sayesinde uzun vadeli siparişlerinizde ani kur değişimlerinden etkilenmezsiniz. Teklif verdiğimiz USD fiyatları sabittir.
              </p>
            </div>
          </div>

          {exchangeRate && (
            <div className="rounded-2xl border-2 border-white/30 bg-white/15 p-6 text-center backdrop-blur-sm">
              <p className="text-sm font-medium text-amber-100">Güncel Döviz Kuru</p>
              <p className="mt-2 text-4xl font-bold">₺{exchangeRate.rate.toFixed(4)}</p>
              <p className="mt-2 text-sm text-amber-100">
                {new Date(exchangeRate.effectiveDate).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })} - {exchangeRate.source.toUpperCase()}
              </p>
              <p className="mt-4 text-xs text-amber-200">
                * Fiyatlar KDV hariç olup, ödeme anındaki güncel kurla hesaplanır
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="products" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Öne Çıkan Ürünler</h2>
              <p className="mt-2 text-slate-600">
                Stokta hazır bulunan sprey, pompa ve PET ambalaj ürünlerimizi inceleyin; adet bazlı fiyat avantajlarını keşfedin.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {products.length} ürün listelendi
            </span>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                    <h3 className="text-xl font-semibold text-slate-900">
                      {product.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {product.description}
                    </p>
                  </header>
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
                      <span className="text-sm text-slate-500">Başlangıç fiyatı</span>
                      <p className="text-2xl font-bold text-amber-600">
                        {product.priceUSD && exchangeRate
                          ? formatDualPrice(product.priceUSD, exchangeRate.rate, true)
                          : formatCurrency(product.price)
                        } <span className="text-sm font-normal text-slate-500">+KDV</span>
                      </p>
                    </div>
                    {(product.bulkPricingUSD || product.bulkPricing) && (product.bulkPricingUSD?.length || product.bulkPricing?.length || 0) > 0 && (
                      <div className="rounded-xl bg-amber-50 p-4" id="pricing">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                          Toplu Alım Avantajı
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-amber-800">
                          {(product.bulkPricingUSD || product.bulkPricing)?.map((tier) => {
                            const itemsPerBox = product.packageInfo?.itemsPerBox || 1;
                            const totalItems = tier.minQty * itemsPerBox;
                            const priceDisplay = product.bulkPricingUSD && exchangeRate
                              ? formatDualPrice(tier.price, exchangeRate.rate, true)
                              : formatCurrency(tier.price);
                            return (
                              <li key={`${product.id}-tier-${tier.minQty}`} className="flex items-center justify-between">
                                <span>
                                  {tier.minQty}+ koli
                                  {itemsPerBox > 1 && (
                                    <span className="text-xs text-slate-600"> ({totalItems.toLocaleString('tr-TR')}+ adet)</span>
                                  )}
                                </span>
                                <span className="font-semibold">{priceDisplay} <span className="text-xs font-normal">+KDV</span></span>
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
                        price: product.price,
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
        </div>
      </section>

      <section
        id="sample"
        className="bg-slate-100 py-16"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 sm:flex-row sm:px-10">
          <div className="flex-1 space-y-4">
            <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-600">
              Numune Talebi
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              Hattınıza uygun ürünü seçin, numunenizi aynı gün hazırlayalım
            </h2>
            <p className="text-slate-600">
              Üretim hatlarınıza en uygun sprey, pompa veya şişeyi seçebilmeniz için ücretsiz numune gönderimi sunuyoruz. Formu doldurun, satış mühendislerimiz 24 saat içinde sizi arayarak ihtiyacınızı netleştirsin.
            </p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>• Numune ve revize edilmiş fiyat teklifini birlikte alırsınız.</li>
              <li>• Özel renk, boy ve aksesuar talepleri için kalıp danışmanlığı sunarız.</li>
              <li>• Talebiniz CRM sistemimize düşer, süreci şeffaf şekilde takip edebilirsiniz.</li>
            </ul>
          </div>
          <div className="flex-1">
            <SampleRequestForm
              categories={categories.map((category) => ({ id: category.id, name: category.name }))}
            />
          </div>
        </div>
      </section>

      <section className="bg-amber-500 py-16 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center sm:px-10">
          <h2 className="text-3xl font-bold">Tedarik zincirinizi SVD Ambalaj güvencesiyle büyütün</h2>
          <p className="max-w-2xl text-lg text-amber-50">
            Toplu siparişlerinizi dakikalar içinde yönetin, ihtiyaç duyduğunuz tüm sprey ve pompa çözümlerini tek merkezden temin edin. SVD Ambalaj ile üretim planlarınızı aksatmadan sürdürebilirsiniz.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/checkout"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-amber-600 shadow-lg shadow-amber-600/30 transition hover:bg-amber-100"
            >
              Teklif Oluştur
            </Link>
            <a
              href="mailto:info@svdambalaj.com"
              className="rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-400/20"
            >
              Satış Ekibiyle İletişime Geç
            </a>
            <a
              href="https://wa.me/905555555555"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp ile Hızlı Destek
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
