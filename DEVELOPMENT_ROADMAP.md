# SVD Ambalaj - Geliştirme Yol Haritası

**Proje:** SVD Ambalaj E-Ticaret Platformu
**Başlangıç Tarihi:** 22 Ekim 2025
**Son Güncelleme:** 9 Aralık 2025

---

## 🆕 Son Eklenen Özellikler

### 9 Aralık 2025
1. **💳 Faz 1.5 - PayTR Ödeme Entegrasyonu - ✅ TAMAMLANDI**
   - PayTR iFrame API entegrasyonu
   - Kredi kartı ile ödeme desteği
   - HMAC-SHA256 hash hesaplaması (token authentication)
   - Test modu ve production modu desteği
   - Ödeme başarılı/başarısız sayfaları
   - Backend endpoints:
     - POST /payment/create-token (iFrame token oluşturma)
     - POST /payment/callback (PayTR IPN handler)
     - GET /settings/payment/public (public payment settings)
   - Admin ayarları:
     - PayTR aktif/pasif toggle
     - Test modu toggle
     - Merchant ID, Key, Salt ayarları
   - Fiyat hesaplama düzeltmeleri:
     - calculateItemTotal kullanarak doğru TRY fiyat
     - Exchange rate çift çarpma sorunu çözüldü
     - Sepet tutarı ile ödeme tutarı uyumu sağlandı

### 29 Ekim 2025
1. **👑 Faz 2.2 - VIP Müşteri Yönetimi - ✅ TAMAMLANDI**
   - VIP Tier Sistemi (Platinum 20%, Gold 15%, Silver 10%, Bronze 5%)
   - Otomatik müşteri segmentasyonu (VIP, High-Potential, New, Passive, Standard)
   - Sipariş ve teklif bazlı VIP belirleme (LTV hesaplama)
   - Account sayfasında VIP badge gösterimi (💎 Platinum, 🥇 Gold, vb.)
   - Sepette VIP indirim uygulaması ve gösterimi
   - İki ayrı indirim mesajı:
     - ✅ Toplu alım indirimi (yeşil kutu)
     - 💎 VIP indirimi (mor kutu) - ek tasarruf miktarıyla
   - Next tier önerisinde VIP indirimli fiyat gösterimi
   - Backend VIP endpoints:
     - GET /user/vip-status (kullanıcı VIP bilgisi)
     - POST /admin/vip/calculate/:userId (tekil hesaplama)
     - PUT /admin/vip/set-tier/:userId (manuel atama)
     - POST /admin/vip/calculate-all (toplu hesaplama)
     - GET /admin/customers (müşteri listesi + filtreleme)
     - GET /admin/customers/:userId/stats (müşteri istatistikleri)
   - Admin customers sayfası (müşteri listesi, VIP yönetimi, segmentasyon)
   - AuthContext VIP status entegrasyonu
2. **💱 USD → TRY Otomatik Fiyat Çevirme - ✅ TAMAMLANDI**
   - CartContext'e exchange rate fetch eklendi
   - Sadece USD fiyatı olan ürünler için otomatik TRY çevirme
   - Fallback mekanizması (34.0 TRY default)
   - getEffectivePrice: priceTRY ?? price ?? (priceUSD × rate)
   - Sorun çözüldü: Fiyatı olmayan ürünler artık çalışıyor
3. **📋 VIP Pricing Altyapısı - ✅ TAMAMLANDI**
   - src/lib/pricing.ts - VIP fiyatlama fonksiyonları
   - calculateVIPPrice, formatVIPPrice
   - getVIPTierBadge, calculateCartTotal
   - src/components/VIPBadge.tsx - VIP gösterimi

### 26 Ekim 2025
1. **👤 Faz 1.4 - Firebase Auth Sistemi - ✅ TAMAMLANDI**
   - Firebase Authentication setup (email/password)
   - Login ve Register sayfaları
   - Şifre sıfırlama ve şifre değiştirme (re-authentication ile güvenlik)
   - Enhanced profil düzenleme modal (avatar, metadata, kategorize edilmiş bölümler)
   - Adres yönetimi - Full CRUD (otomatik varsayılan ilk adres)
   - Backend: 8 user/address endpoint (GET/POST/PUT/DELETE)
   - Checkout entegrasyonu (kayıtlı adreslerle)
   - Korumalı sayfalar (AuthGuard component)
2. **💳 Faz 1.5 - Ödeme Sistemi Seçimi**
   - İyzico'dan PayTR'ye değişiklik (daha düşük komisyon)
   - PayTR başvurusu yapıldı, hazırlık aşamasında
   - Payment altyapısı planlandı (iframe entegrasyon)
3. **🛒 Kullanıcı Deneyimi İyileştirmeleri - ✅ TAMAMLANDI**
   - Cart sayfası fetch hatası düzeltildi (Firebase Functions emulator başlatıldı)
   - Checkout sayfasında profil bilgilerinin otomatik doldurulması
     - Firma adı, email, vergi no kullanıcı profilinden otomatik doldurulur
     - Görsel bildirim: "Fatura bilgileriniz profilinizden otomatik dolduruldu"
     - "(Profilden)" etiketleri ile hangi alanların doldurulduğu gösterilir
   - Modern ürün miktarı seçici (AddToCartButton komponenti)
     - +/- butonları ile kolay miktar artırma/azaltma
     - Direkt sayı girişi desteği
     - Koli/adet dönüşüm bilgisi (örn: "5 koli = 500 adet")
     - Loading spinner animasyonu
     - Minimum miktar kontrolü
     - Responsive ve erişilebilir tasarım
4. **🏢 B2B Teklif & Numune Sistemi İyileştirmeleri - ✅ TAMAMLANDI**
   - Quote ve Sample formlarında otomatik kullanıcı bilgisi doldurma
     - Kayıtlı kullanıcılar için profil ve adres bilgilerini otomatik çekme
     - Backend: `/user/profile` endpoint - eksik profil varsa Auth'dan otomatik oluşturma
   - Teklif formuna detaylı sipariş özeti eklendi
     - Her ürün için: miktar, birim fiyat, koli bilgisi, toplam
     - Ara toplam, KDV, kargo ve genel toplam hesaplamaları
     - Fiyat bilgilendirme uyarısı: "Peşin fiyatlar, vadeye göre değişiklik olabilir"
5. **📊 Admin İstatistikleri Düzeltmeleri - ✅ TAMAMLANDI**
   - Kategori satış yüzdelerinin doğru hesaplanması
     - Yüzde hesabı kategori toplamına göre yapılıyor (totalRevenue yerine)
   - Sipariş subtotal hesaplamalarında koli içi adet sayısı dikkate alınıyor
     - packageInfo ile doğru hesaplama: quantity × itemsPerBox × price
     - Migration endpoint (/admin/migrate-orders) ile eski siparişler güncellendi
   - Cart fiyat gösteriminde priceUSD ve priceTRY parametreleri düzeltildi

### 23 Ekim 2025
1. Admin Ürünler sayfası USD-Only tamamlandı: TRY alanları kaldırıldı, 0.001 adımlı USD fiyat ve USD toplu fiyatlandırma (koli bazlı) aktif
2. Tüm kritik sayfalarda Next.js Image’a geçiş: Ana sayfa ürün/kategori kartları, ürün detayları, admin medya, admin kategori, admin landing, medya seçici, galeri
3. Ürün detaylarında görsel fallback düzeltildi: `/images/placeholders/product.jpg`
4. Sepette ürün teknik özellikleri gösterimi eklendi (hortum boyu, hacim, renk, ağız çapı)
5. Admin Ürünler başlığından “TL → USD Dönüştür” ve “Yenile” aksiyonları kaldırıldı (USD-Only mimariye uyum)
6. Lint temizliği: Kullanılmayan değişkenler kaldırıldı; derleme uyarıları giderildi

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

- ✅ Tamamlandı: Faz 1.1 (Döviz Kuru), Faz 1.2 (Arama/Filtreleme), Faz 1.3 (Sipariş Takip), Faz 1.4 (Firebase Auth), Faz 1.5 (PayTR Ödeme), Faz 2.1 (B2B Teklif & Numune), Faz 2.2 (VIP Müşteri Yönetimi), Faz 2.3 (Kombo İndirimi), UX İyileştirmeleri, PDF Export, Checkout İyileştirme, USD-Only Admin, Görsel optimizasyon, USD → TRY Otomatik Çevirme
- 🔄 Devam Ediyor: Faz 2.4 (Süper Admin Panel - Phase 1 Tamamlandı, Phase 2 Devam Ediyor)
- Not: Proje genelinde dual currency gösterim aktif; satış TL, fiyatlama USD mimarisi kararlı; VIP müşteri sistemi production'da; Kombo indirimi aktif; PayTR kredi kartı ödemesi aktif

**Son Deployment:** 9 Aralık 2025 - Production (Firebase Hosting + Functions)
**Son Commit:** fix: PayTR payment amount calculation - use calculateItemTotal for correct TRY price
**Deployed Services:**
- ✅ Frontend - https://svdfirebase000.web.app
- ✅ API (us-central1) - https://api-tfi7rlxtca-uc.a.run.app
- ✅ SSR Function - https://ssrsvdfirebase000-tfi7rlxtca-uc.a.run.app
- ✅ updateExchangeRate (us-central1) - Daily cron at 16:00
- ✅ forceUpdateExchangeRate (us-central1) - Manual update

**Tamamlanan Fazlar:**
- ✅ **Faz 1.1** - Döviz Kuru Sistemi (13/13 görev)
- ✅ **Faz 1.2** - Ürün Arama ve Filtreleme (6/6 görev)
- ✅ **Faz 1.3** - Sipariş Takip Numarası (6/6 görev)
- ✅ **Faz 1.4** - Firebase Auth Sistemi (13/13 görev)
- ✅ **Faz 1.5** - PayTR Ödeme Entegrasyonu (11/11 görev - 9 Aralık 2025)
- ✅ **Faz 2.1** - B2B Teklif & Numune Sistemi (11/11 görev)
- ✅ **Faz 2.2** - VIP Müşteri Yönetimi ve Segmentasyon (9/9 görev)
- ✅ **Faz 2.3** - Başlık-Şişe Kombo İndirimi (8/8 görev - 31 Ekim 2025)

**Devam Eden Fazlar:**
- 🔄 **Faz 2.4** - Süper Admin Panel (Phase 1/3 Tamamlandı - 1 Kasım 2025)

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
- ⏳ `src/context/CartContext.tsx` - Cart USD calculations (UI’de USD parantez opsiyonu)
- ⏳ `src/app/admin/exchange-rates/page.tsx` - Admin rate management (nice-to-have)
- ✅ Görsel optimizasyon (kritik sayfalar tamam) — kalan minör sayfalar için takip

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
### 1.2 Ürün Arama ve Filtreleme Sistemi 🔍
**Durum:** ✅ TAMAMLANDI
**Tahmini Süre:** 3-4 gün
**Başlangıç:** 23 Ekim 2025
**Bitiş:** 23 Ekim 2025
**Öncelik:** Yüksek

#### Görevler:
- [x] Backend search endpoint (/products/search)
- [x] Backend specifications endpoint (/products/specifications)
- [x] Text search (ürün adı/açıklama)
- [x] Kategori filtresi
- [x] Fiyat aralığı filtresi (USD)
- [x] Teknik özellik filtreleri (hoseLength, volume, color, neckSize)
- [x] Sıralama seçenekleri (Fiyat artan/azalan, En yeni)
- [x] Header search button redesign (gradient amber styling)
- [x] Products page filter UI (accordion)
- [x] URL query parametreleri ile filtreleme

#### Tamamlanan Dosyalar:
Backend:
- ✅ `functions/db/catalog.js` - searchProducts() with specification filters
- ✅ `functions/index.js` - /products/search and /products/specifications endpoints

Frontend:
- ✅ `src/app/products/page.tsx` - Complete filter UI with specifications
- ✅ `src/components/site-header.tsx` - Search button redesign

---

### 1.3 Sipariş Takip Numarası Sistemi 📦
**Durum:** ✅ TAMAMLANDI
**Tahmini Süre:** 2 gün
**Başlangıç:** 23 Ekim 2025
**Bitiş:** 23 Ekim 2025
**Öncelik:** Yüksek

#### Görevler:
- [x] Benzersiz sipariş numarası oluşturma (SVD-YYYYMMDD-XXXX formatı)
- [x] Backend'de orderNumber alanı ekle
- [x] Backend generateOrderNumber fonksiyonu
- [x] Sipariş kaydında exchange rate ve order number kaydetme
- [x] Admin orders page'de tracking number gösterimi
- [x] Checkout success page'de sipariş no gösterimi

#### Tamamlanan Dosyalar:
Backend:
- ✅ `functions/db/orders.js` - generateOrderNumber() ve createOrder() güncellemesi

Frontend:
- ✅ `src/app/admin/orders/page.tsx` - Order number display
- ✅ `src/app/checkout/success/page.tsx` - Order number confirmation

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
**Durum:** ✅ TAMAMLANDI
**Tahmini Süre:** 5-6 gün
**Başlangıç:** 26 Ekim 2025
**Bitiş:** 26 Ekim 2025
**Öncelik:** Yüksek

#### Görevler:
- [x] Firebase Authentication kurulumu
- [x] Kayıt olma sayfası oluştur
- [x] Giriş yapma sayfası oluştur
- [x] Şifre sıfırlama
- [x] Şifre değiştirme (re-authentication ile)
- [x] Kullanıcı profil sayfası (enhanced modal)
- [x] Sipariş geçmişi sayfası
- [x] Adres defteri (Full CRUD)
- [x] Auth context ve hooks
- [x] Protected routes (korumalı sayfalar)
- [x] Backend user CRUD endpoints
- [x] Backend address endpoints (auto-default first address)
- [x] Checkout integration with saved addresses

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

### 1.5 Ödeme Entegrasyonu (PayTR) 💳
**Durum:** ✅ TAMAMLANDI
**Tahmini Süre:** 4-5 gün
**Başlangıç:** 4 Aralık 2025
**Bitiş:** 9 Aralık 2025
**Bağımlılık:** 1.1 tamamlanmalı (ödeme tutarı kur ile hesaplanacak)
**Öncelik:** Yüksek

#### Görevler:
- [x] PayTR hesap onayı ve API anahtarları alma
- [x] PayTR iframe entegrasyon türü seçimi
- [x] Ödeme başlatma endpoint'i (TL tutarı ile)
- [x] PayTR iframe token oluşturma
- [x] Callback/IPN handler (PayTR bildirimleri)
- [x] Ödeme sonuç sayfası
- [x] Başarısız ödeme yönetimi
- [x] Test ortamı kurulumu (test kartları)
- [x] Ödeme kaydında USD/TL dönüşüm bilgisi
- [x] Admin ayarlar sayfası (PayTR credentials)
- [x] Fiyat hesaplama düzeltmeleri

#### Dosyalar:
Backend:
- `functions/payment/paytr.js` (yeni - PayTR servis fonksiyonları)
- `functions/payment/hash.js` (yeni - HMAC-SHA256 hash)
- `functions/payment/config.js` (yeni - PayTR config)
- `functions/db/payments.js` (yeni - Payment CRUD)
- `functions/index.js` (güncelle - 4 payment endpoint)

Frontend:
- `src/app/checkout/page.tsx` (güncelle - ödeme butonu)
- `src/app/checkout/payment/page.tsx` (yeni - PayTR iframe)
- `src/app/checkout/success/page.tsx` (yeni - başarılı ödeme)
- `src/app/payment-failed/page.tsx` (yeni - başarısız ödeme)
- `src/lib/paytr-client.ts` (yeni - PayTR helper)

#### Firestore Collection (payments):
```javascript
{
  id: "auto",
  orderId: "ref",
  userId: "uid",
  paymentToken: "PayTR token",
  merchantOid: "unique-order-id",
  amount: 5106.00,        // TRY
  amountUsd: 147.48,      // USD
  exchangeRate: 34.5678,
  status: "pending",      // pending/success/failed/cancelled
  paymentMethod: "credit_card",
  installment: 1,
  paytrTransactionId: "xxx",
  errorMessage: null,
  ipAddress: "xxx",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Environment Variables:
```bash
# functions/.env
PAYTR_MERCHANT_ID=XXXXX
PAYTR_MERCHANT_KEY=XXXXXXXXXXXXX
PAYTR_MERCHANT_SALT=XXXXXXXXXXXXX
PAYTR_TEST_MODE=true
PAYTR_CALLBACK_URL=https://api-xxx.run.app/payment/callback
PAYTR_SUCCESS_URL=https://yoursite.com/checkout/success
PAYTR_FAIL_URL=https://yoursite.com/payment-failed
```

#### PayTR Endpoints:
```javascript
POST   /payment/create           // Token oluştur
POST   /payment/callback         // IPN handler
GET    /payment/status/:orderId  // Durum sorgula
POST   /payment/verify           // Manuel verify
```

#### PayTR İframe Entegrasyon:
- Müşteri siteden ayrılmaz (güven artırıcı)
- Kolay entegrasyon (5-10 dakika)
- PCI-DSS uyumluluk gerektirmez
- 3D Secure otomatik
- Taksit seçenekleri hazır
- Test kartları: PayTR panelinden alınacak

#### Ödeme Akışı:
1. Kullanıcı checkout'ta "Ödemeye Geç" butonuna tıklar
2. Backend'e sepet bilgisi gönderilir
3. PayTR iframe token oluşturulur
4. Payment sayfasında PayTR iframe açılır
5. Kullanıcı kart bilgilerini girer (PayTR'de)
6. PayTR ödemeyi işler ve callback gönderir
7. Backend callback'i doğrular ve siparişi oluşturur
8. Success/fail sayfasına yönlendirilir

#### Notlar:
- Komisyon: ~%1.95-2.95 (İyzico'dan daha ucuz)
- Entegrasyon türü: iFrame API (önerilen)
- Test modu: PayTR credentials gelene kadar hazırlık yapılacak
- Dokümantasyon: https://dev.paytr.com/

---

## 🚀 FAZ 2: KISA VADELİ (2-4 Hafta)

### 2.1 B2B Teklif & Numune Sistemi 🏢
**Durum:** ✅ TAMAMLANDI
**Tahmini Süre:** 6-7 gün (Tamamlandı)
**Bağımlılık:** 1.1 tamamlanmalı (teklif USD ve TL olarak gösterilecek)
**Öncelik:** Orta

#### Görevler:
- [x] Sepetten teklif oluşturma butonu
- [x] Sepetten numune talebi butonu
- [x] Teklif formu (müşteri bilgileri, ödeme şartları, notlar)
- [x] Numune formu (müşteri bilgileri, notlar)
- [x] Kayıtlı kullanıcılar için otomatik bilgi doldurma
- [x] Teklif formunda detaylı sipariş özeti (ürünler, fiyatlar, toplam)
- [x] Vade uyarısı ("Peşin fiyatlar, vadeye göre değişebilir")
- [x] Backend teklif kaydetme (USD ve TL) - quotes collection
- [x] Backend numune talebi kaydetme - samples collection
- [x] Admin teklif onay/reddetme
- [x] Admin numune onay/reddetme
- [x] Teklif PDF oluşturma (dual currency)
- [x] E-posta ile teklif gönderme
- [x] Teklif geçerlilik süresi (30 gün)
- [x] Onaylı teklifi siparişe dönüştürme

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

### 2.2 VIP Müşteri Yönetimi ve Segmentasyon 👑
**Durum:** ✅ TAMAMLANDI
**Tahmini Süre:** 4-5 gün (Tamamlandı)
**Bağımlılık:** Quotes & Orders sistemi tamamlanmalı
**Öncelik:** Yüksek

#### Görevler:
- [x] VIP tier sistemi (Platinum 20%, Gold 15%, Silver 10%, Bronze 5%)
- [x] Otomatik müşteri segmentasyonu (VIP, High-Potential, New, Passive, Standard)
- [x] Sipariş ve teklif bazlı VIP belirleme
- [x] Admin müşteri yönetim sayfası
- [x] Manuel VIP tier atama
- [x] Batch VIP hesaplama
- [x] VIP pricing altyapısı (calculateVIPPrice, formatVIPPrice)
- [x] VIP badge ve progress bileşenleri
- [x] AuthContext'e VIP status entegrasyonu
- [x] Account sayfasında VIP gösterimi

#### VIP Tier Kriterleri:
- **Platinum (20%)**: 50K+ sipariş, 10+ adet, 30%+ dönüşüm
- **Gold (15%)**: 30K+ sipariş, 7+ adet, 25%+ dönüşüm
- **Silver (10%)**: 15K+ sipariş, 5+ adet, 20%+ dönüşüm
- **Bronze (5%)**: 5K+ sipariş, 3+ adet, 15%+ dönüşüm

#### Müşteri Segmentleri:
- **VIP**: Manuel veya otomatik VIP tier sahipleri
- **High-Potential**: 2+ sipariş, 10K+ değer, aktif (3 ay)
- **New**: 1 sipariş veya teklif, yeni müşteri
- **Passive**: Eski müşteri, 6+ ay inaktif
- **Standard**: Diğer müşteriler

#### Backend API Endpoints:
- `GET /user/vip-status` - Kullanıcı VIP bilgisi
- `POST /admin/vip/calculate/:userId` - Tekil hesaplama
- `PUT /admin/vip/set-tier/:userId` - Manuel atama
- `POST /admin/vip/calculate-all` - Toplu hesaplama
- `GET /vip/tiers` - Tier bilgileri
- `GET /admin/customers` - Müşteri listesi (filtreleme)
- `GET /admin/customers/:userId/stats` - Müşteri istatistikleri

#### Dosyalar:
- `functions/db/vip.js` - VIP hesaplama ve segmentasyon
- `src/lib/pricing.ts` - VIP fiyatlama fonksiyonları
- `src/components/VIPBadge.tsx` - VIP gösterimi
- `src/app/admin/customers/page.tsx` - Admin müşteri yönetimi
- `src/context/AuthContext.tsx` - VIP status entegrasyonu

---

### 2.3 Başlık-Şişe Kombinasyon İndirimi 🔄
**Durum:** ✅ Tamamlandı (31 Ekim 2025)
**Gerçek Süre:** 7 gün
**Bağımlılık:** 1.1 tamamlanmalı (indirim USD üzerinden hesaplanacak)
**Öncelik:** Yüksek

#### Görevler:
- [x] Ürünlere `productType` alanı ekle (başlık/şişe/nötr)
- [x] Ürünlere `neckSize` alanı ekle (24/410, 28/410, vb.)
- [x] Kombinasyon indirim kuralları (admin ayarlanabilir)
- [x] Sepette otomatik kombinasyon algılama
- [x] Eşleşen ağız ölçüsü kontrolü
- [x] Az olan miktara göre indirim uygulama
- [x] Sepette kombinasyon indirimi gösterimi
- [x] Admin panelinde kombinasyon ayarları
- [x] **Ucuz ürünlere öncelik verme (maksimum tasarruf)**
- [x] **Ürün bazında combo quantity gösterimi**
- [x] **Çoklu ürün desteği (3+ ürün)**
- [x] **Detaylı breakdown UI**
- [x] **Frontend-Backend entegrasyonu**
- [x] **Checkout'a combo discount entegrasyonu**
- [x] **Order kayıtlarına combo bilgileri ekleme**

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

#### Tamamlanan Dosyalar:
- ✅ `functions/db/catalog.js` - productType, neckSize, comboPriceUSD eklendi
- ✅ `functions/db/combo-settings.js` - Combo ayarları yönetimi (YENİ)
- ✅ `functions/lib/combo-calculator.js` - Hesaplama mantığı + ucuz ürün önceliği (YENİ)
- ✅ `functions/db/orders.js` - Combo discount field'ları eklendi
- ✅ `functions/index.js` - Combo settings API endpoints
- ✅ `src/context/CartContext.tsx` - Backend settings entegrasyonu, dinamik hesaplama
- ✅ `src/app/cart/page.tsx` - Detaylı combo gösterimi + breakdown
- ✅ `src/app/checkout/page.tsx` - Combo discount entegrasyonu
- ✅ `src/app/admin/products/page.tsx` - comboPriceUSD field'ı eklendi
- ✅ `src/app/admin/combo-settings/page.tsx` - Admin yönetim sayfası (YENİ)
- ✅ `functions/scripts/update-products-from-categories.js` - ProductType migration

#### Öne Çıkan Özellikler:
1. **Ucuz Ürün Önceliği:** Combo her zaman en ucuz ürünlere uygulanır (maksimum tasarruf)
2. **Dinamik Settings:** Admin panelden ayarlanabilir (aktif/pasif, %, sabit tutar, min miktar)
3. **Çoklu Ürün Desteği:** 3+ ürün olsa bile doğru hesaplama
4. **Detaylı Gösterim:** Her ürün için combo'ya dahil olan miktar gösteriliyor
5. **Order Tracking:** Sipariş kayıtlarında combo bilgileri saklanıyor

#### Gerçek Sepet Gösterimi (Uygulanan):
```
Sipariş Özeti
─────────────────────────────────
Toplam Koli: 26
Toplam Ürün: 31.000 adet

Ürün Toplamı: ₺84.729,51 +KDV  (üzeri çizili)

🔄 Kombo İndirimi %10: - ₺6.165,96
  🎉 Kombo İndirimi Uygulandı!

  7.000 adet BAŞLIK + ŞIŞE (24/410)
    • 24 Ağız Parmak Sprey (Siyah): 7.000 adet
    • 100 ml Pet Şişe: 7.000 adet

Ara Toplam (KDV Hariç): ₺78.563,55 +KDV
Kargo: ₺3.120,00
KDV (%20): ₺15.712,71
─────────────────────────────────
Genel Toplam (KDV Dahil): ₺97.396,26
```

**Ürün Kartlarında:**
```
🔵 Siyah Başlık (₺2,10/adet) - 12.000 adet
🔄 Kombo İndirimi! 12.000 adetten 7.000 adedi için %10 indirim (24/410)

⚪ Beyaz Başlık (₺2,52/adet) - 12.000 adet
(Combo yok - daha pahalı, öncelik ucuza verildi)

🟢 Şişe (₺4,19/adet) - 7.000 adet
🔄 Kombo İndirimi! Tüm ürünler (7.000 adet) için %10 indirim (24/410)
```

---

### 2.4 Süper Admin Panel - Tam Kontrol Sistemi ⚙️
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

### 2.5 Promosyon ve Kampanya Kodu Sistemi 🎁
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

### 2.6 Ürün Varyantları (Renk, Boyut) 🎨
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

### 2.7 E-posta Bildirim Sistemi 📧
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
**Durum:** 🔄 Devam Ediyor
**Öncelik:** Orta

#### Görevler:
- [x] Image optimization (Next.js Image) — Ana sayfa, ürünler, ürün detay, admin: ürünler/kategoriler/landing/medya, medya seçici, galeri
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

## 🎯 Aktif Sprint (Güncel Odak)

**Sprint:** Sprint 4 - Ödeme Sistemi & Admin Panel
**Başlangıç:** 1 Aralık 2025
**Bitiş:** 15 Aralık 2025
**Tamamlanan:**
- ✅ Faz 1.1 - Döviz Kuru Sistemi
- ✅ Faz 1.2 - Ürün Arama ve Filtreleme
- ✅ Faz 1.3 - Sipariş Takip Numarası
- ✅ Faz 1.4 - Firebase Auth Sistemi (tam)
- ✅ Faz 1.5 - PayTR Ödeme Entegrasyonu (tam - 9 Aralık 2025)
- ✅ Faz 2.1 - B2B Teklif & Numune Sistemi (tam)
- ✅ Faz 2.2 - VIP Müşteri Yönetimi ve Segmentasyon (tam)
- ✅ Faz 2.3 - Başlık-Şişe Kombo İndirimi (tam)
- ✅ PDF Export Sistemi
- ✅ Checkout Sayfası İyileştirmesi
- ✅ UX İyileştirmeleri (cart fix, checkout auto-fill, modern quantity selector)
- ✅ Admin İstatistikleri Düzeltmeleri (kategori satış, packageInfo)
- ✅ USD → TRY Otomatik Fiyat Çevirme (CartContext)
- ✅ VIP İndirim Gösterimi (sepette iki ayrı mesaj)
- ✅ Production Deployment (Firebase Hosting + Functions)

**Odak (güncel):**
- 🔄 Faz 2.4 - Süper Admin Panel (devam)
- 🔄 ESLint uyarıları temizliği

### Bir Sonraki Adımlar (Önümüzde Neler Var?)
Kısa vadeli:
- [ ] Süper Admin Panel Phase 2 tamamlama
- [ ] E-posta bildirim sistemi iyileştirmeleri
- [ ] PayTR production modu aktivasyonu (canlı ödeme)

Orta vadeli (sonraki sprint):
- [ ] Promosyon/kampanya kodu sistemi (Faz 2.5)
- [ ] Gelişmiş raporlama ve analitik (Faz 3.1)
- [ ] SEO optimizasyonları (Faz 3.3)

Tamamlayıcı iyileştirmeler:
- [ ] Kalan minör sayfalarda next/image dönüşümleri ve lazy loading
- [ ] Test coverage artırımı
- [ ] Performance optimizasyonları

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

**Son Güncelleme:** 9 Aralık 2025
**Bir sonraki review:** 15 Aralık 2025
