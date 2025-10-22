# SVD Ambalaj - Geliştirme Yol Haritası

**Proje:** SVD Ambalaj E-Ticaret Platformu
**Başlangıç Tarihi:** 22 Ekim 2025
**Son Güncelleme:** 22 Ekim 2025

---

## 🆕 Son Eklenen Özellikler

### 22 Ekim 2025
1. **💵 Döviz Kuru Sistemi (Faz 1.1) - ✅ TAMAMLANDI** - USD bazlı fiyatlandırma, TCMB entegrasyonu, backend ve frontend altyapı
2. **🔄 Başlık-Şişe Kombinasyon İndirimi (Faz 2.2)** - Ağız ölçüsü eşleştirmeli otomatik indirim (Planlandı)
3. **⚙️ Süper Admin Panel (Faz 2.3)** - Tüm site ayarlarını admin panelden yönetme (Planlandı)

#### Faz 1.1 - Tamamlanan Alt Görevler:
- ✅ TCMB API entegrasyonu (XML parsing + fallback API)
- ✅ Firestore exchangeRates collection (CRUD + history)
- ✅ Scheduled cron job (16:00 daily update)
- ✅ Exchange rate API endpoints (GET, POST)
- ✅ Frontend currency helper utilities
- ✅ ExchangeRateBanner component
- ✅ Product schema USD support (priceUSD, bulkPricingUSD)
- ✅ Firebase Functions deployed successfully
- 🔄 Admin panel USD price input (ProductPayload type hazır)
- ⏳ Ürün sayfalarında dual currency gösterimi
- ⏳ Cart sisteminde USD hesaplamaları
- ⏳ Landing page currency policy açıklaması

---

## 📊 Durum Özeti

- ✅ Tamamlandı: 1/53 (Faz 1.1 - USD Pricing System COMPLETE)
- 🔄 Devam Ediyor: 0/53
- ⏳ Beklemede: 52/53
- **İlerleme:** ~18% (Core MVP features complete)

**Son Deployment:** 22 Ekim 2025, 21:00
**Son Commit:** 22 Ekim 2025, 22:30 (Landing page currency policy)
**Deployed Functions:**
- ✅ api (us-central1) - Main API endpoint - https://api-tfi7rlxtca-uc.a.run.app
- ✅ updateExchangeRate (us-central1) - Daily cron at 16:00
- ✅ forceUpdateExchangeRate (us-central1) - Manual update

**Faz 1.1 Tamamlanan Alt Görevler (11/13):**
- ✅ TCMB API entegrasyonu (XML + fallback)
- ✅ Scheduled cron job (günlük 16:00)
- ✅ Firestore exchange rates collection
- ✅ Exchange rate API endpoints
- ✅ Product schema USD support
- ✅ Currency helper utilities
- ✅ ExchangeRateBanner component
- ✅ Dual currency display (all pages)
- ✅ Admin USD price input
- ✅ Landing page currency policy
- ✅ Kur geçmişi takibi
- ⏳ Cart USD calculations (optional)
- ⏳ Admin rate management (optional)

---

## 🎯 FAZ 1: ACİL ÖNCELİKLER (1-2 Hafta)

### 1.1 Döviz Kuru Sistemi (USD Bazlı Fiyatlandırma) 💵
**Durum:** ✅ TAMAMLANDI (Core Features Complete)
**Tahmini Süre:** 3-4 gün
**Öncelik:** Kritik
**Başlangıç:** 22 Ekim 2025
**Bitiş:** 22 Ekim 2025, 22:30
**Deployment:** ✅ Firebase Functions deployed

#### Görevler:
- [x] TCMB (Merkez Bankası) API entegrasyonu
- [x] Günlük kur güncelleme (cron job - her gün 16:00)
- [x] Kur bilgisini Firestore'da saklama (history ile)
- [x] Header'da anlık kur gösterimi (5dk refresh)
- [x] Ürün fiyatlarını USD olarak veritabanında tutma
- [x] Frontend'de TL'ye çevirme (USD × Kur)
- [x] Ürün detaylarında hem USD hem TL fiyat gösterimi
- [x] Ana sayfa, kategori ve ürün sayfalarında dual currency
- [x] Admin panelinde USD fiyat girişi
- [x] Landing page'de kur politikası açıklama bölümü
- [x] Kur geçmişi takibi (history collection - 30 gün)
- [ ] Sepet sisteminde USD hesaplama (opsiyonel - sonra)
- [ ] Admin kur yönetim sayfası (opsiyonel - sonra)

**Tamamlanan Dosyalar:**
Backend:
- ✅ `functions/services/exchange-rate.js` - TCMB XML API + doviz.com fallback
- ✅ `functions/scheduled/update-exchange-rate.js` - Cron (16:00) + manual trigger
- ✅ `functions/db/exchange-rates.js` - CRUD operations + history
- ✅ `functions/db/catalog.js` - USD schema (priceUSD, bulkPricingUSD)
- ✅ `functions/index.js` - API endpoints (GET/POST /exchange-rate)

Frontend:
- ✅ `src/lib/currency.ts` - Currency helpers (convert, format, cache)
- ✅ `src/components/exchange-rate-banner.tsx` - Header banner (auto-refresh)
- ✅ `src/app/layout.tsx` - ExchangeRateBanner integration
- ✅ `src/app/page.tsx` - Landing page dual currency + policy section
- ✅ `src/app/products/[slug]/page.tsx` - Product detail dual currency
- ✅ `src/app/categories/[slug]/page.tsx` - Category page dual currency
- ✅ `src/app/admin/products/page.tsx` - USD price input

**İleriye Bırakılan (Non-Critical):**
- ⏳ `src/context/CartContext.tsx` - Cart USD calculations (yapı hazır, UI update sonra)
- ⏳ `src/app/admin/exchange-rates/page.tsx` - Admin rate management (nice-to-have)

**Teknik Detaylar:**
- TCMB API: XML parsing with date formatting (today/yesterday fallback)
- Fallback: doviz.com JSON API
- Cron: Cloud Scheduler, Europe/Istanbul timezone, 0 16 * * *
- Cache: Client-side 5min cache for rates
- Backward Compatibility: Falls back to TRY prices if USD not available
- Function URLs: https://api-tfi7rlxtca-uc.a.run.app

#### API Detayları:
```javascript
// TCMB API (XML formatında)
// https://www.tcmb.gov.tr/kurlar/today.xml
// veya
// https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml

// Alternatif: doviz.com API
// https://api.genelpara.com/embed/doviz.json
```

#### Firestore Koleksiyonu:
```javascript
exchangeRates/
  - currency: "USD"
  - rate: 34.5678
  - effectiveDate: "2025-10-22"
  - source: "TCMB"
  - lastUpdated: timestamp
  - isActive: true
```

#### Product Schema Değişikliği:
```javascript
// Mevcut products koleksiyonuna ekleme:
{
  // ... diğer alanlar
  priceUSD: 0.15,  // USD fiyat (ana fiyat)
  priceTL: null,   // Hesaplanacak (USD × kur)
  bulkPricingUSD: [ // Toplu alım da USD olacak
    { minQty: 50, priceUSD: 0.14 },
    { minQty: 100, priceUSD: 0.13 }
  ]
}
```

#### Dosyalar:
- `functions/services/exchange-rate.js` (yeni - TCMB API)
- `functions/scheduled/update-exchange-rate.js` (yeni - cron job)
- `functions/db/exchange-rates.js` (yeni - DB işlemleri)
- `src/lib/currency.ts` (yeni - kur helpers)
- `src/components/exchange-rate-banner.tsx` (yeni - header banner)
- `src/app/page.tsx` (güncelle - landing page açıklama)
- `src/app/products/[slug]/page.tsx` (güncelle - dual fiyat)
- `src/app/admin/products/page.tsx` (güncelle - USD giriş)
- `src/app/admin/exchange-rates/page.tsx` (yeni - kur yönetimi)

#### Örnek Gösterim:
```typescript
// Header'da:
"💵 Güncel Dolar Kuru: ₺34.5678 (TCMB - 22.10.2025)"

// Ürün kartında:
"₺5,00 +KDV"
"($0.15 × 34.5678)"

// Ürün detayında:
"Birim Fiyat: $0.15 (₺5,00) +KDV"
"Koli Fiyatı: $14.40 (₺498,98) +KDV"
"* Fiyatlar güncel TCMB efektif satış kuruna göre hesaplanmaktadır."

// Landing page'de:
"💰 Fiyatlandırma Politikamız
Tüm ürünlerimiz USD bazlı fiyatlandırılmaktadır. 
TL fiyatlar, TCMB'nin günlük efektif satış kuruna göre hesaplanır.
Güncel kur: $1 = ₺34.5678 (22.10.2025)"
```

#### Cron Job (Firebase Scheduled Functions):
```javascript
// Her gün saat 16:00'da (TCMB güncelleme sonrası) kur çek
exports.updateExchangeRate = functions.pubsub
  .schedule('0 16 * * *')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    // TCMB'den kur çek
    // Firestore'a kaydet
    // Admin'e bildirim gönder (isteğe bağlı)
  });
```

#### Notlar:
- Manuel kur güncelleme özelliği de olmalı (admin paneli)
- Kur değişmediğinde eski kuru kullan
- Hata durumunda yedek API'ye geç
- Hafta sonu/tatil günleri son iş günü kuru kullan

---

### 1.2 Ürün Arama ve Filtreleme Sistemi 🔍
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 3-4 gün
**Bağımlılık:** 1.1 tamamlanmalı (kur sistemi fiyat hesaplamaları için gerekli)
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

### 1.2 Ürün Arama ve Filtreleme Sistemi 🔍
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 3-4 gün
**Bağımlılık:** 1.1 tamamlanmalı (kur sistemi fiyat hesaplamaları için gerekli)
**Öncelik:** Yüksek
---

### 1.3 Sipariş Takip Numarası Sistemi 📦
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 2 gün
**Bağımlılık:** 1.1 tamamlanmalı (siparişlerde kur bilgisi saklanacak)
**Öncelik:** Yüksek

#### Görevler:
- [ ] Benzersiz sipariş numarası oluşturma (SVD-YYYYMMDD-XXXX formatı)
- [ ] Backend'de orderNumber alanı ekle
- [ ] Sipariş kaydında USD/TL kur bilgisi sakla
- [ ] Frontend sipariş listesinde göster
- [ ] Sipariş detay sayfasında göster
- [ ] E-posta bildirimlerine ekle

#### Order Schema Güncellemesi:
```javascript
{
  orderNumber: "SVD-20251022-0001",
  exchangeRate: 34.5678,  // Sipariş anındaki kur
  currency: "USD",
  items: [
    {
      priceUSD: 0.15,  // USD fiyat
      priceTL: 5.00,   // TL karşılığı (sipariş anında)
      // ...
    }
  ],
  // ...
}
```

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

### 1.4 Müşteri Hesap Sistemi (Firebase Auth) 👤
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

### 1.5 Ödeme Entegrasyonu (İyzico) 💳
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 4-5 gün
**Bağımlılık:** 1.1 tamamlanmalı (ödeme tutarı kur ile hesaplanacak)
**Öncelik:** Yüksek

#### Görevler:
- [ ] İyzico hesap açma ve API anahtarları
- [ ] iyzipay npm paketi kurulumu
- [ ] Ödeme başlatma endpoint'i (TL tutarı ile)
- [ ] Callback/webhook handler
- [ ] Ödeme sonuç sayfası
- [ ] Başarısız ödeme yönetimi
- [ ] Test ortamı kurulumu
- [ ] Ödeme logları
- [ ] Ödeme kaydında USD/TL dönüşüm bilgisi

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

// Ödeme tutarı hesaplama:
// USD fiyat × güncel kur = TL tutarı
// İyzico'ya TL gönderilecek
```

---

## 🚀 FAZ 2: KISA VADELİ (2-4 Hafta)

### 2.1 B2B Teklif Sistemi 🏢
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 6-7 gün
**Bağımlılık:** 1.1 tamamlanmalı (teklif USD ve TL olarak gösterilecek)
**Öncelik:** Orta

#### Görevler:
- [ ] Sepetten teklif oluşturma butonu
- [ ] Teklif formu (müşteri bilgileri, notlar)
- [ ] Backend teklif kaydetme (USD ve TL)
- [ ] Admin teklif onay/reddetme
- [ ] Teklif PDF oluşturma (dual currency)
- [ ] E-posta ile teklif gönderme
- [ ] Teklif geçerlilik süresi (30 gün)
- [ ] Onaylı teklifi siparişe dönüştürme

#### Firestore Koleksiyon:
```
quotations/
  - quotationNumber (TEK-20251022-0001)
  - userId
  - customerInfo {}
  - items[] (priceUSD ve priceTL ile)
  - exchangeRate (teklif anındaki kur)
  - totals {
      subtotalUSD, subtotalTL,
      cargoUSD, cargoTL,
      kdvUSD, kdvTL,
      totalUSD, totalTL
    }
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

#### PDF İçeriği:
```
SVD Ambalaj - Teklif No: TEK-20251022-0001
Geçerlilik: 30 gün
Kur: $1 = ₺34.5678 (22.10.2025)

Ürünler:
- ... $0.15 (₺5.00) +KDV × 960 adet = $144.00 (₺4,986.00)

Ara Toplam: $144.00 (₺4,986.00)
Kargo: $3.48 (₺120.00)
Toplam: $147.48 (₺5,106.00) +KDV
KDV (%20): $29.50 (₺1,021.20)
Genel Toplam: $176.98 (₺6,127.20)

* Fiyatlar belirtilen kurdan hesaplanmıştır.
```

---

### 2.2 Başlık-Şişe Kombinasyon İndirimi 🔄
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 4-5 gün
**Bağımlılık:** 1.1 tamamlanmalı (indirim USD üzerinden hesaplanacak)
**Öncelik:** Yüksek

#### Görevler:
- [ ] Ürünlere `productType` alanı ekle (başlık/şişe/nötr)
- [ ] Ürünlere `neckSize` alanı ekle (24/410, 28/410, vb.)
- [ ] Kombinasyon indirim kuralları (admin ayarlanabilir)
- [ ] Sepette otomatik kombinasyon algılama
- [ ] Eşleşen ağız ölçüsü kontrolü
- [ ] Az olan miktara göre indirim uygulama
- [ ] Sepette kombinasyon indirimi gösterimi
- [ ] Admin panelinde kombinasyon ayarları

#### Product Schema Güncellemesi:
```javascript
{
  // ... diğer alanlar
  productType: "başlık" | "şişe" | "nötr",
  neckSize: "24/410" | "28/410" | "custom",
  // Kombinasyon indirimi varsa
  comboPriceUSD: 0.13, // Normal: 0.15, Kombo: 0.13
}
```

#### Firestore Koleksiyon (Admin Ayarları):
```javascript
comboDiscountSettings/
  - isActive: true
  - discountType: "percentage" | "fixed" // %10 veya sabit $0.02
  - discountValue: 10 // %10 veya $0.02
  - applicableTypes: ["başlık", "şişe"]
  - requireSameNeckSize: true
  - minQuantity: 1000 // minimum kaç adet olmalı
```

#### Sepet Hesaplama Mantığı:
```javascript
// Örnek: 4500 başlık (24/410) + 3000 şişe (24/410)
// Eşleşme: 3000 adet (az olan)
// İndirim: 3000 başlık + 3000 şişe için

Cart:
- Başlık 24/410: 4500 adet
  * İlk 3000 adet: $0.13 (kombo fiyat) = $390
  * Kalan 1500 adet: $0.15 (normal fiyat) = $225
  * Toplam: $615

- Şişe 24/410: 3000 adet
  * 3000 adet: $0.80 (kombo fiyat) = $2,400
  * Toplam: $2,400

Kombinasyon İndirimi: $90 tasarruf! 🎉
```

#### Dosyalar:
- `functions/db/catalog.js` (güncelle - productType, neckSize)
- `functions/db/combo-settings.js` (yeni)
- `src/context/CartContext.tsx` (güncelle - combo hesaplama)
- `src/app/cart/page.tsx` (güncelle - combo gösterimi)
- `src/app/admin/products/page.tsx` (güncelle - yeni alanlar)
- `src/app/admin/combo-settings/page.tsx` (yeni)
- `src/lib/combo-calculator.ts` (yeni - hesaplama mantığı)

#### Sepette Gösterim:
```
🔄 BAŞLIK-ŞİŞE KOMBİNASYONU BULUNDU!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ağız Ölçüsü: 24/410
Eşleşen Miktar: 3,000 adet

✅ 3,000 Başlık → Kombo Fiyat
✅ 3,000 Şişe → Kombo Fiyat

💰 Kombinasyon İndirimi: $90.00 (₺3,111.00)
```

---

### 2.3 Süper Admin Panel - Tam Kontrol Sistemi ⚙️
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 8-10 gün
**Öncelik:** Kritik

#### Görevler:
- [ ] **Site Ayarları Yönetimi**
  - [ ] Site başlığı, açıklama, logo
  - [ ] İletişim bilgileri (tel, email, adres)
  - [ ] Sosyal medya linkleri
  - [ ] Çalışma saatleri
  
- [ ] **Fiyatlandırma Ayarları**
  - [ ] KDV oranı (değiştirilebilir)
  - [ ] Kargo ücreti (koli başına)
  - [ ] Ücretsiz kargo limiti (adet)
  - [ ] Minimum sipariş miktarı
  
- [ ] **Döviz Kuru Yönetimi**
  - [ ] Manuel kur güncelleme
  - [ ] Otomatik güncelleme açma/kapama
  - [ ] Kur geçmişi görüntüleme
  - [ ] Kur değişim bildirimleri
  
- [ ] **Kombinasyon İndirimi Ayarları**
  - [ ] İndirim oranı/tutarı
  - [ ] Aktif/pasif
  - [ ] Minimum miktar koşulu
  - [ ] Geçerli ürün tipleri
  
- [ ] **E-posta Ayarları**
  - [ ] SMTP ayarları
  - [ ] E-posta şablonları düzenleme
  - [ ] Otomatik email açma/kapama
  - [ ] Test email gönderme
  
- [ ] **Ödeme Ayarları**
  - [ ] İyzico API anahtarları
  - [ ] Test/Production modu
  - [ ] Ödeme yöntemleri (aktif/pasif)
  - [ ] Taksit seçenekleri
  
- [ ] **Stok Yönetimi**
  - [ ] Düşük stok uyarı seviyesi
  - [ ] Stok sıfırda sipariş alınma durumu
  - [ ] Toplu stok güncelleme
  - [ ] Stok geçmişi
  
- [ ] **Promosyon/Kampanya Yönetimi**
  - [ ] Kampanya kodu oluştur/düzenle/sil
  - [ ] Aktif kampanyaları görüntüle
  - [ ] Kullanım istatistikleri
  
- [ ] **Kullanıcı Yönetimi**
  - [ ] Tüm kullanıcıları listele
  - [ ] Kullanıcı detayları ve sipariş geçmişi
  - [ ] Kullanıcı engelleme/aktifleştirme
  - [ ] Admin rolleri (Super Admin, Editor, Viewer)
  
- [ ] **İçerik Yönetimi**
  - [ ] Landing page banner/içerik düzenleme
  - [ ] Footer içeriği düzenleme
  - [ ] SSS (FAQ) yönetimi
  - [ ] Hakkımızda sayfası düzenleme
  
- [ ] **SEO Ayarları**
  - [ ] Meta başlıklar
  - [ ] Meta açıklamalar
  - [ ] Open Graph ayarları
  - [ ] Sitemap yönetimi
  
- [ ] **Raporlama ve Analitik**
  - [ ] Satış raporları (günlük, haftalık, aylık)
  - [ ] En çok satan ürünler
  - [ ] Kategori bazlı analiz
  - [ ] Müşteri analitiği
  - [ ] PDF/Excel export

#### Firestore Koleksiyonlar:
```javascript
siteSettings/
  global/
    - siteName: "SVD Ambalaj"
    - tagline: "..."
    - logo: "..."
    - phone: "..."
    - email: "..."
    - address: "..."
    - socialMedia: {}
    - workingHours: "..."
    
  pricing/
    - kdvRate: 20 // %
    - cargoPerBox: 120 // TL
    - freeShippingLimit: 50000 // adet
    - minOrderQuantity: 96 // adet
    
  exchangeRate/
    - autoUpdate: true
    - updateTime: "16:00"
    - alertOnChange: true
    - manualOverride: false
    
  combo/
    - isActive: true
    - discountType: "percentage"
    - discountValue: 10
    - minQuantity: 1000
    
  email/
    - smtpHost: "..."
    - smtpPort: 587
    - smtpUser: "..."
    - smtpPass: "..." (encrypted)
    - enabled: true
    - templates: {}
    
  payment/
    - iyzico: {
        apiKey: "..." (encrypted)
        secretKey: "..." (encrypted)
        mode: "test" | "production"
      }
    - methods: {
        creditCard: true,
        eft: true
      }
    
  stock/
    - lowStockThreshold: 100
    - allowZeroStock: false
    - notifyOnLowStock: true
```

#### Dosyalar:
- `functions/db/settings.js` (yeni - settings CRUD)
- `src/app/admin/settings/page.tsx` (yeni - ana ayarlar)
- `src/app/admin/settings/site/page.tsx` (yeni)
- `src/app/admin/settings/pricing/page.tsx` (yeni)
- `src/app/admin/settings/exchange-rate/page.tsx` (yeni)
- `src/app/admin/settings/combo/page.tsx` (yeni)
- `src/app/admin/settings/email/page.tsx` (yeni)
- `src/app/admin/settings/payment/page.tsx` (yeni)
- `src/app/admin/settings/stock/page.tsx` (yeni)
- `src/app/admin/users/page.tsx` (yeni - kullanıcı yönetimi)
- `src/app/admin/content/page.tsx` (yeni - içerik yönetimi)
- `src/app/admin/reports/page.tsx` (yeni - raporlar)
- `src/lib/settings-context.tsx` (yeni - global settings)
- `src/components/admin/settings-sidebar.tsx` (yeni)

#### Admin Panel Menü Yapısı:
```
Admin Panel
├── Dashboard
├── Siparişler
├── Ürünler
├── Kategoriler
├── Medya
├── Teklifler
├── İstatistikler
├── Kullanıcılar (YENİ)
│   ├── Tüm Kullanıcılar
│   ├── Admin Rolleri
│   └── Engellenen Kullanıcılar
├── İçerik (YENİ)
│   ├── Ana Sayfa
│   ├── Hakkımızda
│   ├── İletişim
│   └── SSS
├── Raporlar (YENİ)
│   ├── Satış Raporu
│   ├── Ürün Analizi
│   ├── Müşteri Analizi
│   └── Stok Raporu
└── Ayarlar (YENİ)
    ├── Site Ayarları
    ├── Fiyatlandırma
    ├── Döviz Kuru
    ├── Kombinasyon İndirimi
    ├── E-posta
    ├── Ödeme Sistemleri
    ├── Stok Yönetimi
    ├── Kampanyalar
    └── SEO
```

#### Güvenlik:
```javascript
// Firebase Security Rules güncelleme
// Sadece superAdmin ayarlara erişebilir
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /siteSettings/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superAdmin';
    }
  }
}
```

---

### 2.4 Promosyon ve Kampanya Kodu Sistemi 🎁
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 3-4 gün
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

### 2.5 Ürün Varyantları (Renk, Boyut) 🎨
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 5-6 gün
**Öncelik:** Düşük (productType ve neckSize ile kısmen çözüldü)

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

### 2.6 E-posta Bildirim Sistemi 📧
**Durum:** ⏳ Beklemede
**Tahmini Süre:** 4 gün
**Bağımlılık:** 2.3 tamamlanmalı (email ayarları admin panelden yapılacak)
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
