# SVD Ambalaj - Geliştirme Yol Haritası

**Proje:** SVD Ambalaj E-Ticaret Platformu
**Başlangıç Tarihi:** 22 Ekim 2025
**Son Güncelleme:** 22 Ekim 2025

---

## 📊 Durum Özeti

- ✅ Tamamlandı: 0/50
- 🔄 Devam Ediyor: 0/50
- ⏳ Beklemede: 50/50
- **İlerleme:** 0%

---

## 🎯 FAZ 1: ACİL ÖNCELİKLER (1-2 Hafta)

### 1.1 Ürün Arama ve Filtreleme Sistemi 🔍
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 3-4 gün
**Öncelik:** Yüksek

#### Görevler:
- [ ] Arama çubuğu komponenti oluştur
- [ ] Fiyat aralığı filtresi ekle
- [ ] Stok durumu filtresi (Stokta var/yok)
- [ ] Sıralama seçenekleri (Fiyat artan/azalan, Yeni ürünler)
- [ ] URL query parametreleri ile filtreleme
- [ ] Filtreleri temizle butonu

#### Dosyalar:
- `src/components/product-filters.tsx` (yeni)
- `src/components/product-search.tsx` (yeni)
- `src/app/products/page.tsx` (güncelle)
- `src/app/categories/[slug]/page.tsx` (güncelle)

#### Notlar:
```typescript
// Örnek filtre yapısı:
type ProductFilters = {
  search: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'popular';
}
```

---

### 1.2 Sipariş Takip Numarası Sistemi 📦
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 2 gün
**Öncelik:** Yüksek

#### Görevler:
- [ ] Benzersiz sipariş numarası oluşturma (SVD-YYYYMMDD-XXXX formatı)
- [ ] Backend'de orderNumber alanı ekle
- [ ] Frontend sipariş listesinde göster
- [ ] Sipariş detay sayfasında göster
- [ ] E-posta bildirimlerine ekle

#### Dosyalar:
- `functions/db/orders.js` (güncelle - createOrder fonksiyonu)
- `src/app/admin/orders/page.tsx` (güncelle)
- `src/app/checkout/success/page.tsx` (güncelle)

#### Notlar:
```javascript
// Sipariş no örneği: SVD-20251022-0001
const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SVD-${dateStr}-${random}`;
}
```

---

### 1.3 Müşteri Hesap Sistemi (Firebase Auth) 👤
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 5-6 gün
**Öncelik:** Yüksek

#### Görevler:
- [ ] Firebase Authentication kurulumu
- [ ] Kayıt olma sayfası oluştur
- [ ] Giriş yapma sayfası oluştur
- [ ] Şifre sıfırlama
- [ ] Kullanıcı profil sayfası
- [ ] Sipariş geçmişi sayfası
- [ ] Adres defteri
- [ ] Auth context ve hooks
- [ ] Protected routes (korumalı sayfalar)

#### Dosyalar:
- `src/lib/firebase-auth.ts` (yeni)
- `src/context/AuthContext.tsx` (yeni)
- `src/app/auth/login/page.tsx` (yeni)
- `src/app/auth/register/page.tsx` (yeni)
- `src/app/account/page.tsx` (yeni)
- `src/app/account/orders/page.tsx` (yeni)
- `src/app/account/addresses/page.tsx` (yeni)
- `src/components/auth/auth-guard.tsx` (yeni)
- `functions/db/users.js` (yeni)

#### Firestore Koleksiyonlar:
```
users/
  - uid (document ID)
  - email
  - name
  - phone
  - company
  - taxNumber
  - addresses[] (birden fazla adres)
  - createdAt
  - updatedAt
  
userAddresses/
  - userId
  - title (Ev, İş, vb.)
  - name
  - phone
  - address
  - city
  - district
  - postalCode
  - isDefault
```

---

### 1.4 Ödeme Entegrasyonu (İyzico) 💳
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 4-5 gün
**Öncelik:** Yüksek

#### Görevler:
- [ ] İyzico hesap açma ve API anahtarları
- [ ] iyzipay npm paketi kurulumu
- [ ] Ödeme başlatma endpoint'i
- [ ] Callback/webhook handler
- [ ] Ödeme sonuç sayfası
- [ ] Başarısız ödeme yönetimi
- [ ] Test ortamı kurulumu
- [ ] Ödeme logları

#### Dosyalar:
- `functions/payment/iyzico.js` (yeni)
- `functions/index.js` (güncelle - payment endpoints)
- `src/app/checkout/page.tsx` (güncelle)
- `src/app/checkout/payment/page.tsx` (yeni)
- `src/app/checkout/callback/page.tsx` (yeni)

#### Notlar:
```javascript
// .env eklenecek:
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com (test)
```

---

## 🚀 FAZ 2: KISA VADELİ (2-4 Hafta)

### 2.1 B2B Teklif Sistemi 🏢
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 6-7 gün
**Öncelik:** Orta

#### Görevler:
- [ ] Sepetten teklif oluşturma butonu
- [ ] Teklif formu (müşteri bilgileri, notlar)
- [ ] Backend teklif kaydetme
- [ ] Admin teklif onay/reddetme
- [ ] Teklif PDF oluşturma
- [ ] E-posta ile teklif gönderme
- [ ] Teklif geçerlilik süresi (30 gün)
- [ ] Onaylı teklifi siparişe dönüştürme

#### Firestore Koleksiyon:
```
quotations/
  - quotationNumber (TEK-20251022-0001)
  - userId
  - customerInfo {}
  - items[]
  - totals {}
  - status (pending/approved/rejected/converted)
  - validUntil
  - adminNotes
  - createdAt
  - approvedAt
```

#### Dosyalar:
- `functions/db/quotations.js` (yeni)
- `src/app/quotation/request/page.tsx` (yeni)
- `src/app/admin/quotations/page.tsx` (yeni)
- `src/components/quotation-pdf.tsx` (yeni)

---

### 2.2 Promosyon ve Kampanya Kodu Sistemi 🎁
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 4-5 gün
**Öncelik:** Orta

#### Görevler:
- [ ] Kampanya kodu oluşturma (admin)
- [ ] İndirim türleri (yüzde, sabit tutar, ücretsiz kargo)
- [ ] Minimum sepet tutarı koşulu
- [ ] Kategori/ürün kısıtlamaları
- [ ] Kullanım limiti
- [ ] Geçerlilik tarihi
- [ ] Sepette kod uygulama
- [ ] İndirim hesaplama ve gösterim

#### Firestore Koleksiyon:
```
promotions/
  - code (YILBASI2025)
  - type (percentage/fixed/free_shipping)
  - value (20 veya 100)
  - minOrderAmount
  - applicableCategories[]
  - applicableProducts[]
  - maxUsage
  - currentUsage
  - validFrom
  - validUntil
  - isActive
```

#### Dosyalar:
- `functions/db/promotions.js` (yeni)
- `src/app/admin/promotions/page.tsx` (yeni)
- `src/app/cart/page.tsx` (güncelle - kod girişi)
- `src/context/CartContext.tsx` (güncelle - indirim hesaplama)

---

### 2.3 Ürün Varyantları (Renk, Boyut) 🎨
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 5-6 gün
**Öncelik:** Orta

#### Görevler:
- [ ] Ürün varyant yapısı oluştur
- [ ] Admin panelinde varyant ekleme/düzenleme
- [ ] Her varyant için ayrı stok
- [ ] Her varyant için ayrı SKU
- [ ] Ürün sayfasında varyant seçimi
- [ ] Seçilen varyanta göre fiyat/stok güncelleme
- [ ] Sepette varyant bilgisi gösterme

#### Product Schema Güncellemesi:
```javascript
variants: [
  {
    id: 'variant-1',
    attributes: { color: 'Siyah', size: '24/410' },
    sku: 'SP-24-BLK',
    price: 5.00, // varsa özel fiyat
    stock: 500,
    images: ['variant-image-1.jpg'] // varsa özel görseller
  }
]
```

#### Dosyalar:
- `functions/db/catalog.js` (güncelle)
- `src/app/admin/products/page.tsx` (güncelle - variant yönetimi)
- `src/app/products/[slug]/page.tsx` (güncelle - variant seçimi)
- `src/components/product-variant-selector.tsx` (yeni)

---

### 2.4 E-posta Bildirim Sistemi 📧
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 4 gün
**Öncelik:** Orta

#### Görevler:
- [ ] Firebase Extensions (Trigger Email) kurulumu
- [ ] E-posta şablonları oluştur
- [ ] Sipariş onay e-postası
- [ ] Sipariş durum değişikliği e-postası
- [ ] Teklif onay/red e-postası
- [ ] Hoş geldin e-postası (yeni kayıt)
- [ ] Şifre sıfırlama e-postası
- [ ] Kampanya bildirimleri

#### E-posta Şablonları:
- `email-templates/order-confirmation.html`
- `email-templates/order-status-update.html`
- `email-templates/quotation-approved.html`
- `email-templates/welcome.html`
- `email-templates/campaign.html`

#### Dosyalar:
- `functions/email/templates.js` (yeni)
- `functions/email/sender.js` (yeni)
- `functions/index.js` (güncelle - email triggers)

---

## 📈 FAZ 3: ORTA VADELİ (1-3 Ay)

### 3.1 Gelişmiş Analitik ve Raporlar 📊
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 7-8 gün
**Öncelik:** Orta

#### Görevler:
- [ ] Müşteri yaşam boyu değeri (LTV) hesaplama
- [ ] Sepet terk oranı izleme
- [ ] Dönüşüm hunisi
- [ ] Saatlik satış trendi
- [ ] En çok satan ürünler widget'ı
- [ ] Bölgesel satış haritası
- [ ] Müşteri segmentasyonu
- [ ] Cohort analizi
- [ ] Excel/CSV export

#### Dosyalar:
- `functions/analytics/metrics.js` (yeni)
- `src/app/admin/analytics/page.tsx` (yeni)
- `src/components/admin/charts/` (yeni klasör)

---

### 3.2 Gelişmiş Stok Yönetimi 📦
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 5-6 gün
**Öncelik:** Orta

#### Görevler:
- [ ] Stok uyarı seviyesi
- [ ] Kritik stok bildirimleri
- [ ] Stok hareketi kayıtları (giriş/çıkış)
- [ ] Birden fazla depo yönetimi
- [ ] Seri no/lot takibi
- [ ] Stok sayım modülü
- [ ] Envanter raporu
- [ ] ABC analizi

#### Firestore Koleksiyonlar:
```
stockMovements/
  - productId
  - variantId
  - type (in/out/adjustment)
  - quantity
  - warehouse
  - reason
  - referenceId (sipariş id vb.)
  - createdBy
  - createdAt

warehouses/
  - name
  - location
  - isActive
```

---

### 3.3 SEO Optimizasyonları 🔍
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 4-5 gün
**Öncelik:** Orta

#### Görevler:
- [ ] Dinamik meta tags (her sayfa için)
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] JSON-LD yapılandırılmış veri
- [ ] Sitemap.xml otomatik oluşturma
- [ ] robots.txt düzenleme
- [ ] Canonical URL'ler
- [ ] Alt text optimizasyonu
- [ ] Blog/İçerik modülü
- [ ] SSG/ISR optimizasyonu

#### Dosyalar:
- `src/app/sitemap.ts` (yeni)
- `src/app/robots.ts` (yeni)
- `src/lib/seo.ts` (yeni - meta tag helper)
- `src/app/blog/` (yeni klasör)

---

### 3.4 Müşteri Yorumları ve Değerlendirmeler ⭐
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 5 gün
**Öncelik:** Düşük

#### Görevler:
- [ ] Yorum yapma formu
- [ ] Yıldız puanlama sistemi
- [ ] Fotoğraf yükleme
- [ ] Admin onay sistemi
- [ ] Yorum moderasyonu
- [ ] Yanıt yazma (admin)
- [ ] Yardımcı buldum butonu
- [ ] Ortalama puan hesaplama

#### Firestore Koleksiyon:
```
reviews/
  - productId
  - userId
  - userName
  - rating (1-5)
  - title
  - comment
  - images[]
  - verified (satın aldı mı?)
  - status (pending/approved/rejected)
  - helpfulCount
  - adminReply
  - createdAt
```

---

## 🌟 FAZ 4: UZUN VADELİ (3+ Ay)

### 4.1 Mobil Uygulama (React Native) 📱
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 30-45 gün
**Öncelik:** Düşük

#### Görevler:
- [ ] React Native proje kurulumu
- [ ] Firebase SDK entegrasyonu
- [ ] Navigation yapısı
- [ ] Push notification
- [ ] Barkod okuyucu
- [ ] Kamera entegrasyonu
- [ ] iOS ve Android build
- [ ] App Store ve Play Store yayınlama

---

### 4.2 Bayi Yönetim Sistemi 🤝
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 15-20 gün
**Öncelik:** Düşük

#### Görevler:
- [ ] Bayi kayıt sistemi
- [ ] Bayi onay süreci
- [ ] Özel fiyat listeleri
- [ ] Komisyon hesaplama
- [ ] Alt bayi yönetimi
- [ ] Bayi performans raporları
- [ ] Bayi özel panel

---

### 4.3 AI Destekli Ürün Önerileri 🤖
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 10-12 gün
**Öncelik:** Düşük

#### Görevler:
- [ ] Kullanıcı davranış analizi
- [ ] Collaborative filtering
- [ ] Content-based filtering
- [ ] Anasayfada kişiselleştirilmiş öneriler
- [ ] "Benzer ürünler" algoritması
- [ ] "Sıklıkla birlikte alınanlar"

---

## 🔧 FAZ 5: TEKNİK İYİLEŞTİRMELER

### 5.1 Performans Optimizasyonu ⚡
**Durum:** ⏳ Beklemede
**Öncelik:** Orta

#### Görevler:
- [ ] Image optimization (Next.js Image)
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Redis cache
- [ ] CDN kullanımı
- [ ] Bundle size analizi
- [ ] Lighthouse skoru iyileştirme

---

### 5.2 Güvenlik İyileştirmeleri 🔒
**Durum:** ⏳ Beklemede
**Öncelik:** Yüksek

#### Görevler:
- [ ] Rate limiting
- [ ] CAPTCHA (reCAPTCHA v3)
- [ ] Input validation
- [ ] HTTPS zorunluluğu
- [ ] CSP headers
- [ ] XSS koruması
- [ ] SQL injection koruması
- [ ] CORS yapılandırması

---

### 5.3 Test ve Kalite Güvence 🧪
**Durum:** ⏳ Beklemede
**Öncelik:** Orta

#### Görevler:
- [ ] Jest kurulumu
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Visual regression tests
- [ ] Test coverage (>80%)
- [ ] CI/CD pipeline (GitHub Actions)

---

## 📝 Notlar ve Kararlar

### Teknoloji Kararları
- **Auth:** Firebase Authentication
- **Ödeme:** İyzico
- **Email:** Firebase Extensions (Trigger Email)
- **Analytics:** Google Analytics 4 + Custom Dashboard
- **Testing:** Jest + Playwright
- **CI/CD:** GitHub Actions

### Veritabanı Şeması Değişiklikleri
Gerekli yeni koleksiyonlar:
- ✅ `users` (kullanıcı profilleri)
- ✅ `userAddresses` (adres defteri)
- ✅ `quotations` (teklifler)
- ✅ `promotions` (kampanyalar)
- ✅ `reviews` (yorumlar)
- ✅ `stockMovements` (stok hareketleri)
- ✅ `warehouses` (depolar)
- ✅ `companies` (kurumsal müşteriler)

### Bağımlılık Güncellemeleri
```json
{
  "iyzipay": "^1.0.43",
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.0",
  "recharts": "^2.10.0",
  "xlsx": "^0.18.5",
  "html2canvas": "^1.4.1",
  "date-fns": "^2.30.0"
}
```

---

## 🎯 Aktif Sprint

**Sprint:** Sprint 1 - Acil Öncelikler
**Başlangıç:** 22 Ekim 2025
**Bitiş:** 5 Kasım 2025
**Odak:** Ürün arama, sipariş takip, kullanıcı hesapları, ödeme

### Bu Sprint'te Yapılacaklar:
1. ✅ Ürün arama ve filtreleme
2. ✅ Sipariş takip numarası
3. ✅ Firebase Auth entegrasyonu
4. ✅ İyzico ödeme entegrasyonu

---

## 📊 Metrikler ve Hedefler

### Performans Hedefleri
- Lighthouse Score: >90
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Bundle Size: <500KB

### İş Hedefleri
- Kullanıcı kaydı: 100+ ilk ayda
- Dönüşüm oranı: >2%
- Ortalama sipariş değeri: 1000₺+
- Müşteri memnuniyeti: >4.5/5

---

**Son Güncelleme:** 22 Ekim 2025
**Bir sonraki review:** 1 Kasım 2025
