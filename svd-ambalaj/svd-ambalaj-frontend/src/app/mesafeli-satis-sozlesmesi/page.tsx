import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi | SVD Ambalaj",
  description: "SVD Ambalaj mesafeli satış sözleşmesi ve ön bilgilendirme formu.",
};

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">
            Mesafeli Satış Sözleşmesi
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-slate-500 mb-6">
              Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 1 - TARAFLAR</h2>

              <h3 className="text-lg font-medium text-slate-700 mb-2">1.1 SATICI</h3>
              <div className="bg-slate-50 rounded-lg p-4 text-sm mb-4">
                <p><strong>Ticari Unvan:</strong> SVD AMBALAJ PLASTİK OTO.İNŞ.SAN.TİCARET LTD.ŞTİ</p>
                <p><strong>Adres:</strong> İVEDİK OSB 1354, Y.MAHALLE/ANKARA</p>
                <p><strong>Telefon:</strong> (312) 395 67 27</p>
                <p><strong>E-posta:</strong> lastik_jantevi@hotmail.com</p>
                <p><strong>Vergi Dairesi:</strong> İVEDİK VERGİ DAİRESİ</p>
                <p><strong>VKN:</strong> 7880981971</p>
                <p><strong>Ticaret Sicil No:</strong> 457297 / ANKARA</p>
              </div>

              <h3 className="text-lg font-medium text-slate-700 mb-2">1.2 ALICI</h3>
              <p className="text-slate-600">
                Web sitesinde üyelik oluşturarak sipariş veren gerçek veya tüzel kişidir.
                Alıcı bilgileri sipariş formunda belirtilmektedir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 2 - KONU</h2>
              <p className="text-slate-600">
                İşbu sözleşmenin konusu, ALICI&apos;nın SATICI&apos;ya ait www.spreyvalfdunyasi.com
                internet sitesinden elektronik ortamda siparişini verdiği aşağıda nitelikleri ve
                satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı
                Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri
                gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 3 - SÖZLEŞME KONUSU ÜRÜN BİLGİLERİ</h2>
              <p className="text-slate-600 mb-4">
                Ürünün temel özellikleri (türü, miktarı, marka/modeli, rengi, adedi) SATICI&apos;ya ait
                internet sitesinde yer almaktadır. Ürün özellikleri sipariş onayında ve faturada
                belirtilecektir.
              </p>
              <p className="text-slate-600">
                Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve
                vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan
                edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 4 - GENEL HÜKÜMLER</h2>
              <ul className="list-decimal pl-6 text-slate-600 space-y-3">
                <li>
                  ALICI, SATICI&apos;ya ait internet sitesinde sözleşme konusu ürünün temel nitelikleri,
                  satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup, bilgi sahibi
                  olduğunu, elektronik ortamda gerekli teyidi verdiğini kabul, beyan ve taahhüt eder.
                </li>
                <li>
                  ALICI&apos;nın; Ön Bilgilendirmeyi elektronik ortamda teyit etmesi, mesafeli satış
                  sözleşmesinin kurulmasından evvel, SATICI tarafından ALICI&apos;ya verilmesi gereken
                  adresi, siparişi verilen ürünlere ait temel özellikleri, ürünlerin vergiler dâhil
                  fiyatını, ödeme ve teslimat bilgilerini de doğru ve eksiksiz olarak edindiğini
                  kabul, beyan ve taahhüt eder.
                </li>
                <li>
                  Sözleşme konusu her bir ürün, yasal 30 günlük süreyi aşmamak koşulu ile ALICI&apos;nın
                  yerleşim yeri uzaklığına bağlı olarak internet sitesindeki ön bilgiler kısmında
                  belirtilen süre zarfında ALICI veya ALICI&apos;nın gösterdiği adresteki kişi ve/veya
                  kuruluşa teslim edilir.
                </li>
                <li>
                  SATICI, sözleşme konusu ürünü eksiksiz, siparişte belirtilen niteliklere uygun ve
                  varsa garanti belgeleri, kullanım kılavuzları ile teslim etmeyi, her türlü
                  ayıptan arî olarak yasal mevzuat gereklerine göre sağlam, standartlara uygun bir
                  şekilde işi doğruluk ve dürüstlük esasları dâhilinde ifa etmeyi, hizmet kalitesini
                  koruyup yükseltmeyi, işin ifası sırasında gerekli dikkat ve özeni göstermeyi,
                  ihtiyat ve öngörü ile hareket etmeyi kabul, beyan ve taahhüt eder.
                </li>
                <li>
                  SATICI, sözleşmeden doğan ifa yükümlülüğünün süresi dolmadan ALICI&apos;yı bilgilendirmek
                  ve açıkça onayını almak suretiyle eşit kalite ve fiyatta farklı bir ürün tedarik
                  edebilir.
                </li>
                <li>
                  SATICI, sipariş konusu ürün veya hizmetin yerine getirilmesinin imkânsızlaşması
                  halinde sözleşme konusu yükümlülüklerini yerine getiremezse, bu durumu, öğrendiği
                  tarihten itibaren 3 gün içinde yazılı olarak tüketiciye bildireceğini, 14 günlük
                  süre içinde toplam bedeli ALICI&apos;ya iade edeceğini kabul, beyan ve taahhüt eder.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 5 - ALICI&apos;NIN BEYAN VE TAAHHÜTLERİ</h2>
              <p className="text-slate-600">
                ALICI, sözleşme konusu ürünü teslim almadan önce muayene edecek; ezik, kırık,
                ambalajı yırtılmış vb. hasarlı ve ayıplı ürünü kargo şirketinden teslim almayacaktır.
                Teslim alınan ürünün hasarsız ve sağlam olduğu kabul edilecektir. Teslimden sonra
                ürünün özenle korunması borcu, ALICI&apos;ya aittir. Cayma hakkı kullanılacaksa ürün
                kullanılmamalıdır.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 6 - CAYMA HAKKI</h2>
              <p className="text-slate-600 mb-4">
                ALICI; mesafeli sözleşmenin mal satışına ilişkin olması durumunda, ürünün kendisine
                veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren 14 (on dört) gün
                içerisinde, SATICI&apos;ya bildirmek şartıyla, hiçbir hukuki ve cezai sorumluluk
                üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma
                hakkını kullanabilir.
              </p>
              <p className="text-slate-600 mb-4">
                Cayma hakkının kullanılması için 14 (on dört) günlük süre içinde SATICI&apos;ya
                e-posta veya telefon ile bildirimde bulunulması ve ürünün MADDE 7 hükümleri
                çerçevesinde kullanılmamış olması şarttır.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-semibold mb-2">Cayma hakkı kullanılamayacak ürünler:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Fiyatı finansal piyasalardaki dalgalanmalara bağlı ürünler</li>
                  <li>Tüketici talebine göre hazırlanan veya kişiye özel ürünler</li>
                  <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler</li>
                  <li>Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış ürünler</li>
                  <li>Niteliği itibarıyla iade edilemeyecek, hızla bozulma veya son kullanma tarihi geçme ihtimali olan ürünler</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 7 - CAYMA HAKKININ KULLANIM ŞARTLARI</h2>
              <p className="text-slate-600 mb-4">
                ALICI cayma hakkını kullandığına ilişkin bildirimi yönelttiği tarihten itibaren
                10 gün içinde ürünü SATICI&apos;ya geri göndermek zorundadır.
              </p>
              <p className="text-slate-600 mb-4">
                Cayma hakkının kullanılması halinde:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>ALICI&apos;ya veya ALICI&apos;nın belirlediği üçüncü kişiye teslim edilen ürünün faturası (İade edilecek ürünün faturası kurumsal ise, iade ederken kurumun düzenlemiş olduğu iade faturası ile birlikte gönderilmesi gerekmektedir. Faturası şahıs adına düzenlenen sipariş iadeleri iade faturası kesilmeden tamamlanamayacaktır.)</li>
                <li>İade formu</li>
                <li>İade edilecek ürünlerin kutusu, ambalajı, varsa standart aksesuarları ile birlikte eksiksiz ve hasarsız olarak teslim edilmesi gerekmektedir.</li>
              </ul>
              <p className="text-slate-600 mt-4">
                SATICI, cayma bildiriminin kendisine ulaşmasından itibaren en geç 14 gün içerisinde
                toplam bedeli ve ALICI&apos;yı borç altına sokan belgeleri ALICI&apos;ya iade etmek zorundadır.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 8 - TESLİMAT</h2>
              <p className="text-slate-600 mb-4">
                Teslimat, ALICI&apos;nın sipariş formunda belirttiği adrese yapılacaktır. Ürün,
                anlaşmalı kargo şirketi aracılığıyla ALICI&apos;nın belirttiği adrese teslim edilecektir.
              </p>
              <p className="text-slate-600">
                Teslimat süresi, sipariş onayından itibaren 30 (otuz) iş gününü geçemez.
                SATICI, ürünü sipariş tarihinden itibaren en geç 30 gün içerisinde teslim eder.
                Bu süre içerisinde ürün teslim edilmezse ALICI sözleşmeyi feshedebilir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 9 - ÖDEME VE TESLİMAT</h2>
              <p className="text-slate-600 mb-4">
                Banka havalesi, EFT veya kapıda ödeme yöntemleriyle yapılabilir. Sipariş tutarı,
                ürün bedeli ve varsa kargo bedeli toplamından oluşur.
              </p>
              <p className="text-slate-600">
                Fatura, sipariş teslimatı sırasında ürünlerle birlikte ALICI&apos;nın adresine
                teslim edilecektir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 10 - UYUŞMAZLIK VE YETKİLİ MAHKEME</h2>
              <p className="text-slate-600 mb-4">
                İşbu sözleşmenin uygulanmasında, Sanayi ve Ticaret Bakanlığınca ilan edilen
                değere kadar Tüketici Hakem Heyetleri ile ALICI&apos;nın veya SATICI&apos;nın
                yerleşim yerindeki Tüketici Mahkemeleri yetkilidir.
              </p>
              <p className="text-slate-600">
                Siparişin gerçekleşmesi durumunda ALICI işbu sözleşmenin tüm koşullarını
                kabul etmiş sayılır.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">MADDE 11 - YÜRÜRLÜK</h2>
              <p className="text-slate-600">
                ALICI, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde işbu
                sözleşmenin tüm şartlarını kabul etmiş sayılır. SATICI, siparişin gerçekleşmesi
                öncesinde işbu sözleşmenin sitede ALICI tarafından okunup kabul edildiğine dair
                onay alacak şekilde gerekli yazılımsal düzenlemeleri yapmakla yükümlüdür.
              </p>
            </section>

            <div className="mt-8 p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
              <p><strong>SATICI:</strong> SVD AMBALAJ PLASTİK OTO.İNŞ.SAN.TİCARET LTD.ŞTİ</p>
              <p><strong>TARİH:</strong> Sipariş tarihi itibariyle geçerlidir.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
