import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Sprey Valf Dünyası olarak Türkiye'nin en geniş sprey valf ve ambalaj ürünleri yelpazesini sunuyoruz. Kaliteli ürünler, uygun fiyatlar ve hızlı teslimat.",
  keywords: [
    "sprey valf dünyası",
    "ambalaj firması",
    "toptan sprey valf",
    "ambalaj tedarikçisi",
    "türkiye ambalaj",
  ],
  alternates: {
    canonical: "/hakkimizda",
  },
  openGraph: {
    title: "Hakkımızda | Sprey Valf Dünyası",
    description:
      "Türkiye'nin en geniş sprey valf ve ambalaj ürünleri yelpazesi. Kaliteli ürünler, uygun fiyatlar.",
    type: "website",
  },
};

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Kalite Garantisi",
    description: "Tüm ürünlerimiz kalite kontrolünden geçirilir ve standartlara uygun olarak temin edilir.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Hızlı Teslimat",
    description: "Siparişleriniz en kısa sürede hazırlanır ve güvenilir kargo firmalarıyla kapınıza ulaştırılır.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Uygun Fiyatlar",
    description: "Toptan alım avantajlarıyla rekabetçi fiyatlar sunuyoruz. Alım miktarınız arttıkça fiyatlarınız düşer.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "Teknik Destek",
    description: "Ürün seçimi ve teknik konularda uzman ekibimiz size yardımcı olmaya hazır.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    title: "Geniş Stok",
    description: "Binlerce ürün çeşidiyle Türkiye'nin en geniş sprey valf ve ambalaj ürünleri stokuna sahibiz.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Kurumsal Fatura",
    description: "Tüm siparişlerinize e-fatura veya e-arşiv fatura düzenlenmektedir.",
  },
];

const stats = [
  { value: "500+", label: "Ürün Çeşidi" },
  { value: "1000+", label: "Mutlu Müşteri" },
  { value: "81", label: "İl'e Teslimat" },
  { value: "7/24", label: "Online Sipariş" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
              Türkiye&apos;nin Ambalaj Partneri
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold text-slate-900">
              Sprey Valf Dünyası
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Kozmetik, temizlik ve endüstriyel sektörler için kapsamlı sprey valf
              ve ambalaj çözümleri sunuyoruz. Kaliteli ürünler, rekabetçi fiyatlar
              ve güvenilir hizmet anlayışıyla yanınızdayız.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white p-6 text-center shadow-lg shadow-amber-500/5 border border-slate-100"
              >
                <div className="text-3xl sm:text-4xl font-bold text-amber-600">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Content */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Neden Bizi Tercih Etmelisiniz?
              </h2>
              <p className="mt-4 text-slate-600">
                Yılların tecrübesi ve sektör bilgisiyle, işletmenizin ambalaj
                ihtiyaçlarını en doğru şekilde karşılıyoruz. Müşteri memnuniyetini
                ön planda tutarak, kaliteli ürünleri en uygun fiyatlarla sunmayı
                hedefliyoruz.
              </p>
              <p className="mt-4 text-slate-600">
                Trigger sprey, pompa sprey, kapak, şişe ve daha birçok ambalaj
                ürününü tek bir adreste bulabilirsiniz. Toptan alım avantajlarıyla
                maliyetlerinizi düşürün, işinizi büyütün.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600"
                >
                  Ürünleri İncele
                </Link>
                <Link
                  href="/iletisim"
                  className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-500 hover:text-amber-600"
                >
                  İletişime Geç
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {features.slice(0, 4).map((feature, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white p-5 shadow-md border border-slate-100"
                >
                  <div className="inline-flex items-center justify-center rounded-lg bg-amber-100 p-2 text-amber-600">
                    {feature.icon}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Avantajlarımız
            </h2>
            <p className="mt-3 text-slate-600">
              Sizin için en iyi hizmeti sunmak adına çalışıyoruz
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl bg-white p-6 shadow-md border border-slate-100 hover:shadow-lg transition"
              >
                <div className="inline-flex items-center justify-center rounded-lg bg-amber-100 p-3 text-amber-600">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-8 sm:p-12 text-center text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Hemen Alışverişe Başlayın
            </h2>
            <p className="mt-3 text-amber-100 max-w-xl mx-auto">
              Binlerce ürün arasından işletmenize uygun olanları seçin, toptan
              fiyat avantajlarından yararlanın.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-amber-600 shadow-lg transition hover:bg-amber-50"
              >
                Ürünleri Keşfet
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center rounded-full border-2 border-white/30 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Sıkça Sorulan Sorular
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
