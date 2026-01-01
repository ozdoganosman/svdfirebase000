import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cerez Politikasi | SVD Ambalaj",
  description: "SVD Ambalaj cerez (cookie) politikasi ve cerez kullanimi hakkinda bilgilendirme.",
};

export default function CerezPolitikasiPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">
            Cerez Politikasi
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-slate-500 mb-6">
              Son guncelleme: {new Date().toLocaleDateString("tr-TR")}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Cerez Nedir?</h2>
              <p className="text-slate-600 mb-4">
                Cerezler (cookies), web sitelerinin bilgisayariniza veya mobil cihaziniza
                yerlestirdigi kucuk metin dosyalaridir. Bu dosyalar, siteyi ziyaret ettiginizde
                sizi tanimak, tercihlerinizi hatirlamak ve size daha iyi bir deneyim sunmak
                icin kullanilir.
              </p>
              <p className="text-slate-600">
                Cerezler, kisisel verilerinize erisim saglamaz veya cihaziniza zarar vermez.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Kullandigimiz Cerez Turleri</h2>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Zorunlu Cerezler</h3>
                  <p className="text-sm text-slate-600">
                    Sitenin duzgun calismasi icin gerekli olan cerezlerdir. Oturum yonetimi,
                    sepet bilgileri ve guvenlik islemleri icin kullanilir. Bu cerezler
                    devre disi birakilamaz.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Performans Cerezleri</h3>
                  <p className="text-sm text-slate-600">
                    Sitenin nasil kullanildigini anlamamiza yardimci olan cerezlerdir.
                    Sayfa goruntulenme sayilari, ziyaret suresi gibi anonim istatistikler toplar.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Islevsellik Cerezleri</h3>
                  <p className="text-sm text-slate-600">
                    Tercihlerinizi (dil secimi, bolge vb.) hatirlamak icin kullanilir.
                    Kisisellestirmis deneyim sunar.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-800 mb-2">Pazarlama/Hedefleme Cerezleri</h3>
                  <p className="text-sm text-slate-600">
                    Ilgi alanlariniza uygun reklamlar gostermek icin kullanilir.
                    Ucuncu taraf reklam aglari tarafindan yerlestirilir.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Kullandigimiz Cerezler</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Cerez Adi</th>
                      <th className="px-4 py-2 text-left font-semibold">Tur</th>
                      <th className="px-4 py-2 text-left font-semibold">Amac</th>
                      <th className="px-4 py-2 text-left font-semibold">Sure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-2">session_token</td>
                      <td className="px-4 py-2">Zorunlu</td>
                      <td className="px-4 py-2">Oturum yonetimi</td>
                      <td className="px-4 py-2">Oturum</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">cart_items</td>
                      <td className="px-4 py-2">Zorunlu</td>
                      <td className="px-4 py-2">Sepet bilgileri</td>
                      <td className="px-4 py-2">7 gun</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">_ga</td>
                      <td className="px-4 py-2">Performans</td>
                      <td className="px-4 py-2">Google Analytics</td>
                      <td className="px-4 py-2">2 yil</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">_gid</td>
                      <td className="px-4 py-2">Performans</td>
                      <td className="px-4 py-2">Google Analytics</td>
                      <td className="px-4 py-2">24 saat</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">cookie_consent</td>
                      <td className="px-4 py-2">Zorunlu</td>
                      <td className="px-4 py-2">Cerez tercihleri</td>
                      <td className="px-4 py-2">1 yil</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Cerezleri Nasil Kontrol Edebilirsiniz?</h2>
              <p className="text-slate-600 mb-4">
                Cerezleri tarayici ayarlarinizdan yonetebilirsiniz. Cogu tarayici asagidaki
                secenekleri sunar:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Tum cerezleri kabul et</li>
                <li>Yeni cerez yerlestirildiginde bildir</li>
                <li>Tum cerezleri reddet</li>
                <li>Mevcut cerezleri sil</li>
              </ul>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-semibold mb-2">Onemli Not:</p>
                <p>
                  Cerezleri devre disi birakmaniz durumunda sitenin bazi ozellikleri
                  duzgun calismayabilir. Ornegin, sepetiniz kaydedilmeyebilir veya
                  oturum acik kalmayabilir.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Tarayici Ayarlari</h2>
              <p className="text-slate-600 mb-4">
                Cerez ayarlarinizi degistirmek icin tarayicinizin yardim bolumunu kullanabilirsiniz:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Chrome:</strong> Ayarlar &gt; Gizlilik ve Guvenlik &gt; Cerezler</li>
                <li><strong>Firefox:</strong> Ayarlar &gt; Gizlilik ve Guvenlik &gt; Cerezler</li>
                <li><strong>Safari:</strong> Tercihler &gt; Gizlilik &gt; Cerezler</li>
                <li><strong>Edge:</strong> Ayarlar &gt; Cerezler ve site izinleri</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">6. Ucuncu Taraf Cerezleri</h2>
              <p className="text-slate-600 mb-4">
                Sitemizde asagidaki ucuncu taraf hizmetleri cerez kullanabilir:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Google Analytics:</strong> Site trafigi analizi</li>
                <li><strong>Firebase:</strong> Kimlik dogrulama ve veri depolama</li>
              </ul>
              <p className="text-slate-600 mt-4">
                Bu hizmetlerin kendi gizlilik politikalari vardir ve cerez kullanimlari
                kendi politikalarina tabidir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">7. Politika Degisiklikleri</h2>
              <p className="text-slate-600">
                Bu cerez politikasini zaman zaman guncelleyebiliriz. Degisiklikler
                bu sayfada yayinlanacaktir. Onemli degisikliklerde sizi bilgilendirecegiz.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">8. Iletisim</h2>
              <p className="text-slate-600 mb-4">
                Cerez politikamiz hakkinda sorulariniz icin:
              </p>
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p><strong>SVD AMBALAJ PLASTIK OTO.INS.SAN.TICARET LTD.STI</strong></p>
                <p><strong>E-posta:</strong> lastik_jantevi@hotmail.com</p>
                <p><strong>Telefon:</strong> (312) 395 67 27</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
