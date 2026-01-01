import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni | SVD Ambalaj",
  description: "SVD Ambalaj gizlilik politikası ve kişisel verilerin korunması hakkında aydınlatma metni.",
};

export default function GizlilikPolitikasiPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">
            Gizlilik Politikası ve KVKK Aydınlatma Metni
          </h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-slate-500 mb-6">
              Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">1. Veri Sorumlusu</h2>
              <p className="text-slate-600 mb-4">
                6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, kişisel verileriniz;
                veri sorumlusu olarak <strong>SVD AMBALAJ PLASTİK OTO.İNŞ.SAN.TİCARET LTD.ŞTİ</strong>
                (&quot;Şirket&quot;) tarafından aşağıda açıklanan kapsamda işlenebilecektir.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p><strong>Ticari Unvan:</strong> SVD AMBALAJ PLASTİK OTO.İNŞ.SAN.TİCARET LTD.ŞTİ</p>
                <p><strong>Adres:</strong> İVEDİK OSB 1354, Y.MAHALLE/ANKARA</p>
                <p><strong>Telefon:</strong> (312) 395 67 27</p>
                <p><strong>E-posta:</strong> lastik_jantevi@hotmail.com</p>
                <p><strong>Vergi Dairesi:</strong> İVEDİK VERGİ DAİRESİ</p>
                <p><strong>VKN:</strong> 7880981971</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">2. Toplanan Kişisel Veriler</h2>
              <p className="text-slate-600 mb-4">
                Şirketimiz tarafından aşağıdaki kişisel veriler toplanmaktadır:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
                <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, teslimat adresi, fatura adresi</li>
                <li><strong>Müşteri İşlem Bilgileri:</strong> Sipariş geçmişi, sepet bilgileri, ödeme bilgileri</li>
                <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, çerez verileri, oturum bilgileri</li>
                <li><strong>Pazarlama Bilgileri:</strong> Alışveriş tercihleri, kampanya katılımları (izin verilmesi halinde)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">3. Kişisel Verilerin İşlenme Amaçları</h2>
              <p className="text-slate-600 mb-4">
                Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Üyelik işlemlerinin gerçekleştirilmesi ve yönetimi</li>
                <li>Sipariş süreçlerinin yürütülmesi ve teslimat işlemleri</li>
                <li>Fatura düzenlenmesi ve muhasebe işlemleri</li>
                <li>Müşteri hizmetleri ve destek taleplerinin karşılanması</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>İletişim faaliyetlerinin yürütülmesi</li>
                <li>Ürün ve hizmetlerimizin tanıtımı (izin verilmesi halinde)</li>
                <li>Site güvenliğinin sağlanması ve dolandırıcılık önleme</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">4. Kişisel Verilerin Aktarılması</h2>
              <p className="text-slate-600 mb-4">
                Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Kargo ve lojistik firmalarına (teslimat amacıyla)</li>
                <li>Ödeme kuruluşlarına ve bankalara (ödeme işlemleri için)</li>
                <li>Yasal yükümlülükler kapsamında yetkili kamu kurum ve kuruluşlarına</li>
                <li>Hukuki süreçlerde avukatlar ve danışmanlara</li>
              </ul>
              <p className="text-slate-600 mt-4">
                aktarılabilecektir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
              <p className="text-slate-600 mb-4">
                Kişisel verileriniz; web sitemiz, mobil uygulamamız, e-posta, telefon ve diğer iletişim
                kanalları aracılığıyla otomatik ve otomatik olmayan yöntemlerle toplanmaktadır.
              </p>
              <p className="text-slate-600">
                Hukuki sebepler: Sözleşmenin kurulması ve ifası, kanunlarda açıkça öngörülmesi,
                veri sorumlusunun meşru menfaati, açık rıza.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">6. KVKK Kapsamındaki Haklarınız</h2>
              <p className="text-slate-600 mb-4">
                KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
                <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                <li>KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">7. Veri Saklama Süresi</h2>
              <p className="text-slate-600">
                Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve yasal saklama
                süreleri kapsamında muhafaza edilecektir. Yasal sürelerin sona ermesi veya işleme
                amacının ortadan kalkması halinde kişisel verileriniz silinecek, yok edilecek veya
                anonim hale getirilecektir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">8. İletişim</h2>
              <p className="text-slate-600 mb-4">
                KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki iletişim kanallarından
                bizimle iletişime geçebilirsiniz:
              </p>
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p><strong>E-posta:</strong> lastik_jantevi@hotmail.com</p>
                <p><strong>Telefon:</strong> (312) 395 67 27</p>
                <p><strong>Adres:</strong> İVEDİK OSB 1354, Y.MAHALLE/ANKARA</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
