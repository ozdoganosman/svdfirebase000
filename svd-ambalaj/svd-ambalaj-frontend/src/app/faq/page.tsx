import { Metadata } from "next";
import Link from "next/link";
import { FAQJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular (SSS)",
  description:
    "Sprey valf, ambalaj ürünleri, toptan sipariş, kargo ve ödeme seçenekleri hakkında sıkça sorulan sorular ve cevapları.",
  keywords: [
    "sprey valf sss",
    "ambalaj sıkça sorulan sorular",
    "toptan sipariş nasıl yapılır",
    "sprey başlığı fiyatları",
    "kargo süresi",
  ],
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Sıkça Sorulan Sorular | Sprey Valf Dünyası",
    description:
      "Sprey valf ve ambalaj ürünleri hakkında merak edilenler. Sipariş, kargo ve ödeme bilgileri.",
    type: "website",
  },
};

// FAQ data - commonly asked questions about spray valves and packaging
const faqItems = [
  {
    question: "Minimum sipariş miktarı nedir?",
    answer:
      "Ürünlerimiz koli bazlı satılmaktadır. Her ürünün kendi minimum sipariş adedi bulunur ve bu bilgi ürün sayfasında belirtilmektedir. Genellikle minimum sipariş 1 koli olup, koli içi adet sayısı ürüne göre değişiklik gösterir.",
  },
  {
    question: "Toptan fiyat nasıl hesaplanır?",
    answer:
      "Toptan fiyatlarımız koli adedine göre kademeli olarak düşmektedir. Ne kadar çok sipariş verirseniz, birim fiyatı o kadar uygun olur. Fiyat kademelerini her ürün sayfasında detaylı olarak görebilirsiniz.",
  },
  {
    question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
    answer:
      "Kredi kartı, banka havalesi/EFT ve kapıda ödeme seçeneklerimiz mevcuttur. Kurumsal müşterilerimiz için vadeli ödeme imkanı da sunulmaktadır. Detaylı bilgi için bizimle iletişime geçebilirsiniz.",
  },
  {
    question: "Kargo süresi ne kadardır?",
    answer:
      "Stokta bulunan ürünler için siparişiniz 1-2 iş günü içinde kargoya verilir. Türkiye genelinde teslimat süresi ortalama 2-4 iş günüdür. Büyük hacimli siparişlerde özel lojistik çözümler sunulmaktadır.",
  },
  {
    question: "Kargo ücreti ne kadar?",
    answer:
      "Kargo ücreti sipariş tutarına ve teslimat adresine göre değişiklik gösterir. Belirli tutarın üzerindeki siparişlerde ücretsiz kargo imkanı sunulmaktadır. Sepetinizde tam tutarı görebilirsiniz.",
  },
  {
    question: "Ürünler için numune alabilir miyim?",
    answer:
      "Evet, toptan alım öncesi numune talebinde bulunabilirsiniz. Numune ücretleri ürüne göre değişmekte olup, sipariş vermeniz halinde numune bedeli toplam siparişten düşülmektedir.",
  },
  {
    question: "Sprey valf boyutları nasıl belirlenir?",
    answer:
      "Sprey valfler boyun çapı (neck size) ile ölçülür. En yaygın boyutlar 20/410, 24/410 ve 28/410'dur. İlk sayı boyun çapını (mm), ikinci sayı kapak tipini belirtir. Şişeniz için doğru valf seçimi konusunda size yardımcı olabiliriz.",
  },
  {
    question: "Trigger sprey ile pompa sprey arasındaki fark nedir?",
    answer:
      "Trigger sprey (tetikli sprey) genellikle temizlik ürünleri için kullanılır ve geniş alan spreyleme sağlar. Pompa sprey ise kozmetik ve kişisel bakım ürünlerinde tercih edilir, daha ince ve kontrollü spreyleme sunar.",
  },
  {
    question: "Ürünleriniz gıda ile temasa uygun mu?",
    answer:
      "Bazı ürünlerimiz gıda ile temasa uygun malzemelerden üretilmiştir. Bu ürünler ürün açıklamasında belirtilmektedir. Gıda uygulamaları için özel sertifikalı ürünlerimiz hakkında bilgi almak için bizimle iletişime geçebilirsiniz.",
  },
  {
    question: "Özel tasarım veya logo baskısı yapıyor musunuz?",
    answer:
      "Evet, belirli adet üzeri siparişlerde özel logo baskısı ve renk seçenekleri sunmaktayız. Kurumsal kimliğinize uygun ambalaj çözümleri için satış ekibimizle görüşebilirsiniz.",
  },
  {
    question: "İade ve değişim koşulları nelerdir?",
    answer:
      "Üretim hatası veya hasarlı teslimat durumunda ürünler değiştirilebilir veya iade alınabilir. İade işlemi için ürünün orijinal ambalajında, kullanılmamış olması gerekmektedir. Detaylı bilgi için müşteri hizmetlerimize ulaşabilirsiniz.",
  },
  {
    question: "Fatura kesiliyor mu?",
    answer:
      "Evet, tüm siparişlere e-fatura veya e-arşiv fatura düzenlenmektedir. Kurumsal müşterilerimiz için şirket adına fatura kesilebilmektedir. Fatura bilgilerinizi sipariş sırasında girmeniz yeterlidir.",
  },
  {
    question: "Yurt dışına teslimat yapıyor musunuz?",
    answer:
      "Şu an için Türkiye genelinde hizmet vermekteyiz. Yurt dışı siparişleri için özel düzenlemeler yapılabilmektedir. Detaylı bilgi için bizimle iletişime geçmenizi rica ederiz.",
  },
  {
    question: "Stokta olmayan ürünler için ne yapabilirim?",
    answer:
      "Stokta bulunmayan ürünler için talep formu doldurabilir veya bizimle iletişime geçebilirsiniz. Ürün stoğa geldiğinde size bildirim gönderilir. Ayrıca belirli adetlerin üzerinde özel üretim siparişi de alınmaktadır.",
  },
  {
    question: "Hesap oluşturmak zorunlu mu?",
    answer:
      "Hayır, misafir olarak da sipariş verebilirsiniz. Ancak hesap oluşturduğunuzda sipariş takibi, adres kaydetme ve özel fiyatlardan yararlanma gibi avantajlardan faydalanabilirsiniz.",
  },
];

export default function FAQPage() {
  return (
    <>
      <FAQJsonLd items={faqItems} />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
              Yardım Merkezi
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
              Sıkça Sorulan Sorular
            </h1>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
              Sprey valf ve ambalaj ürünleri hakkında merak ettiğiniz her şey.
              Sorunuzun cevabını bulamadıysanız{" "}
              <Link
                href="/iletisim"
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                bizimle iletişime geçin
              </Link>
              .
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span className="pr-4">{item.question}</span>
                  <span className="ml-2 flex-shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-500 transition-transform group-open:rotate-180">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-6 py-4 text-slate-600">
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center text-white shadow-lg">
            <h2 className="text-xl font-bold">Başka Sorunuz mu Var?</h2>
            <p className="mt-2 text-amber-100">
              Müşteri hizmetlerimiz size yardımcı olmaktan mutluluk duyar.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/iletisim"
                className="inline-flex items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-amber-600 shadow-md transition hover:bg-amber-50"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                İletişime Geçin
              </Link>
              <a
                href="tel:+905076078906"
                className="inline-flex items-center rounded-full border-2 border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                0507 607 89 06
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
