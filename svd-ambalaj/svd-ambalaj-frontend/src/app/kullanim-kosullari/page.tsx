import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları | SVD Ambalaj",
  description: "SVD Ambalaj web sitesi kullanım koşulları ve üyelik sözleşmesi.",
};

export default function KullanimKosullariPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">
            Kullanım Koşulları
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-slate-500 mb-6">
              Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. GİRİŞ</h2>
              <p className="text-slate-600 mb-4">
                www.spreyvalfdunyasi.com web sitesi (&quot;Site&quot;), SVD AMBALAJ PLASTİK OTO.İNŞ.SAN.TİCARET LTD.ŞTİ
                (&quot;Şirket&quot;) tarafından işletilmektedir.
              </p>
              <p className="text-slate-600">
                Bu web sitesini kullanarak, aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız.
                Lütfen bu koşulları dikkatle okuyunuz. Bu koşulları kabul etmiyorsanız, siteyi
                kullanmayınız.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. TANIMLAR</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Site:</strong> www.spreyvalfdunyasi.com alan adlı web sitesi</li>
                <li><strong>Şirket:</strong> SVD AMBALAJ PLASTİK OTO.İNŞ.SAN.TİCARET LTD.ŞTİ</li>
                <li><strong>Kullanıcı:</strong> Siteyi ziyaret eden ve/veya üye olan gerçek veya tüzel kişiler</li>
                <li><strong>Üye:</strong> Sitede hesap oluşturan kullanıcılar</li>
                <li><strong>İçerik:</strong> Sitede yer alan tüm metin, görsel, video ve diğer materyaller</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. ÜYELİK KOŞULLARI</h2>
              <ul className="list-decimal pl-6 text-slate-600 space-y-3">
                <li>
                  Üyelik, 18 yaşını doldurmuş veya yasal temsilcisi aracılığıyla işlem yapan
                  kişilere açıktır.
                </li>
                <li>
                  Üyelik oluşturmak için gerçek ve doğru bilgiler sağlamanız gerekmektedir.
                  Yanlış veya yanıltıcı bilgi vermek üyeliğinizin iptaline neden olabilir.
                </li>
                <li>
                  Üye, hesap bilgilerinin gizliliğinden ve güvenliğinden sorumludur.
                  Hesap bilgilerinizi üçüncü kişilerle paylaşmayınız.
                </li>
                <li>
                  Şirket, herhangi bir gerekçe göstermeksizin üyelik başvurusunu reddetme
                  veya mevcut üyeliği askıya alma/iptal etme hakkını saklı tutar.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">4. SİPARİŞ VE ÖDEME</h2>
              <ul className="list-decimal pl-6 text-slate-600 space-y-3">
                <li>
                  Sitede listelenen fiyatlar Türk Lirası cinsindendir ve aksi belirtilmedikçe
                  KDV hariçtir.
                </li>
                <li>
                  Şirket, fiyatları önceden haber vermeksizin değiştirme hakkını saklı tutar.
                  Ancak sipariş verildikten sonra fiyat değişikliği uygulanmaz.
                </li>
                <li>
                  Ödeme işlemleri güvenli ödeme altyapısı üzerinden gerçekleştirilir.
                </li>
                <li>
                  Sipariş onayı, ödemenin tamamlanmasından sonra e-posta ile gönderilir.
                </li>
                <li>
                  Şirket, stok durumuna göre siparişi iptal etme veya kısmi teslimat
                  yapma hakkını saklı tutar.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">5. FİKRİ MÜLKİYET HAKLARI</h2>
              <p className="text-slate-600 mb-4">
                Site içeriğindeki tüm metin, görsel, logo, grafik, ses, video ve diğer materyaller
                Şirket&apos;in mülkiyetindedir veya lisans altında kullanılmaktadır. Bu içeriklerin
                izinsiz kopyalanması, çoğaltılması, dağıtılması veya değiştirilmesi yasaktır.
              </p>
              <p className="text-slate-600">
                &quot;SVD Ambalaj&quot; markası ve logosu tescilli marka olup, izinsiz kullanılamaz.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">6. KULLANICI SORUMLULUKLARI</h2>
              <p className="text-slate-600 mb-4">Kullanıcılar aşağıdaki kurallara uymayı kabul eder:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Siteyi yasalara uygun şekilde kullanmak</li>
                <li>Başkalarının haklarını ihlal etmemek</li>
                <li>Zararlı yazılım yaymamak veya sitenin güvenliğini tehlikeye atmamak</li>
                <li>Sahte veya yanıltıcı bilgi paylaşmamak</li>
                <li>Spam veya istenmeyen içerik göndermemek</li>
                <li>Siteyi ticari olmayan kişisel amaçlarla kullanmak (satın alma hariç)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">7. SORUMLULUK SINIRLAMASI</h2>
              <p className="text-slate-600 mb-4">
                Site &quot;olduğu gibi&quot; sunulmaktadır. Şirket, sitenin kesintisiz veya hatasız
                çalışacağını garanti etmez.
              </p>
              <p className="text-slate-600 mb-4">
                Şirket, aşağıdaki durumlardan kaynaklanan zararlardan sorumlu tutulamaz:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Sitenin kullanılamaması veya erişilememesi</li>
                <li>Teknik arızalar veya bakım çalışmaları</li>
                <li>Üçüncü taraf sitelere verilen linkler</li>
                <li>Kullanıcı hatası veya ihmali</li>
                <li>Mücbir sebepler (doğal afet, savaş, pandemi vb.)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">8. GİZLİLİK</h2>
              <p className="text-slate-600">
                Kişisel verilerinizin işlenmesi hakkında detaylı bilgi için
                <a href="/gizlilik-politikasi" className="text-amber-600 hover:underline ml-1">
                  Gizlilik Politikası
                </a>
                &apos;nı inceleyiniz.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">9. DEĞİŞİKLİKLER</h2>
              <p className="text-slate-600">
                Şirket, bu kullanım koşullarını herhangi bir zamanda değiştirme hakkını saklı tutar.
                Değişiklikler sitede yayınlandığı tarihten itibaren geçerli olur. Siteyi kullanmaya
                devam etmeniz, güncellenmiş koşulları kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">10. UYGULANACAK HUKUK VE YETKİLİ MAHKEME</h2>
              <p className="text-slate-600">
                Bu kullanım koşulları Türkiye Cumhuriyeti yasalarına tabidir.
                Uyuşmazlıklarda Ankara Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">11. İLETİŞİM</h2>
              <p className="text-slate-600 mb-4">
                Bu kullanım koşulları hakkında sorularınız için bizimle iletişime geçebilirsiniz:
              </p>
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p><strong>SVD AMBALAJ PLASTİK OTO.İNŞ.SAN.TİCARET LTD.ŞTİ</strong></p>
                <p><strong>Adres:</strong> İVEDİK OSB 1354, Y.MAHALLE/ANKARA</p>
                <p><strong>Telefon:</strong> (312) 395 67 27</p>
                <p><strong>E-posta:</strong> lastik_jantevi@hotmail.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
