# 🚀 SVD Ambalaj - Hızlı Test Rehberi

Sprint 1 özelliklerini hızlıca test etmek için adım adım rehber.

---

## 📧 TEST 1: Email Sistemi (5 dakika)

### Manuel Email Testi

1. **Firestore Console'a git**: https://console.firebase.google.com/project/svdfirebase000/firestore/data/~2Fmail

2. **Email dokümanı ekle**:
   - "Start collection" veya "Add document" tıklayın
   - Document ID: **Auto-ID** bırakın

3. **Alanları ekle**:
   ```
   to (string): mhmtclk1634@gmail.com
   message (map):
     ├─ subject (string): SVD Ambalaj Test
     ├─ text (string): Email sistemi çalışıyor!
     └─ html (string): <h1>Test OK</h1><p>Email çalışıyor! 🎉</p>
   ```

4. **Save** tıklayın

5. **30 saniye bekleyin**

6. **Email kutunuzu kontrol edin** (spam folder dahil!)

7. **Firestore'da durumu kontrol**:
   - Az önce oluşturduğunuz dokümanı açın
   - `delivery` alanı otomatik eklenmiş olmalı
   - `delivery.state` → `SUCCESS` ✅ veya `ERROR` ❌

### ✅ Başarı Kriterleri:
- Email geldi ✅
- `delivery.state === "SUCCESS"` ✅
- HTML formatting düzgün ✅

---

## 🏢 TEST 2: Quote (Teklif) Sistemi (10 dakika)

### A) Müşteri Olarak Quote Talebi

1. **Siteye git**: https://svdfirebase000.web.app

2. **Login ol** (veya kayıt ol)

3. **Ürün ekle**:
   - Ürün sayfasına git
   - Sepete ürün ekle
   - Sepete git: `/cart`

4. **Teklif İste**:
   - Sepette **"Teklif İste"** butonuna tıkla
   - Formu doldur (otomatik dolu gelecek)
   - **Submit** et

5. **Kontrol et**:
   - `/account/quotes` sayfasına git
   - Teklifin listelendiğini gör
   - Status: **"Pending"** (Beklemede) olmalı

### B) Admin Olarak Quote Onaylama

1. **Admin login**: `/auth/login`
   - Email: `admin@example.com` (veya `.env`'deki admin)
   - Password: Admin şifreniz

2. **Admin Quotes sayfası**: `/admin/quotes`

3. **Quote'u onayla**:
   - Pending quote'a tıkla
   - **"Onayla"** butonuna tıkla
   - Admin notları ekle (opsiyonel)
   - **Submit** et

4. **PDF indir**:
   - **"PDF İndir"** butonuna tıkla
   - PDF doğru açıldı mı kontrol et
   - Müşteri bilgileri, ürünler, toplam tutarlar doğru mu?

5. **Email kontrolü**:
   - Firestore > `mail` collection'a git
   - Yeni email dokümanı eklenmiş olmalı
   - `to`: müşteri emaili
   - `delivery.state`: SUCCESS?
   - Müşteri emailine bak - PDF eki geldi mi?

### ✅ Başarı Kriterleri:
- Quote talebi oluşturuldu ✅
- Admin'de görünüyor ✅
- Onaylama çalıştı ✅
- PDF indirildi ve doğru ✅
- Email gönderildi (delivery.state = SUCCESS) ✅
- Müşteri PDF'i aldı ✅

---

## 👑 TEST 3: VIP Müşteri Sistemi (10 dakika)

### A) VIP Tier Atama

1. **Admin login**: `/auth/login`

2. **Customers sayfası**: `/admin/customers`

3. **Müşteri listesi**:
   - Tüm müşterileri gör
   - Segment filtresi çalışıyor mu?

4. **Manuel VIP atama**:
   - Bir müşteri seç
   - **"VIP Seviyesi Ata"** tıkla
   - Tier seç: Platinum / Gold / Silver / Bronze
   - **Kaydet**

5. **VIP badge kontrolü**:
   - Müşteri kartında VIP badge göründü mü?
   - Doğru tier mi? (💎 Platinum, 🥇 Gold, 🥈 Silver, 🥉 Bronze)
   - Discount % doğru mu? (20% / 15% / 10% / 5%)

### B) VIP Müşteri Deneyimi

1. **VIP müşteri olarak login**:
   - Az önce VIP tier atadığınız müşteriyle login yapın

2. **Account sayfası**: `/account`
   - VIP badge görünüyor mu?
   - Tier adı doğru mu?
   - Discount percentage görünüyor mu?

3. **VIP Progress**:
   - Progress bar var mı?
   - Sonraki tier'a kadar ne kadar kaldığını gösteriyor mu?

4. **VIP Pricing**:
   - Ürün sayfasına git
   - Fiyatlarda indirim görünüyor mu?
   - Orijinal fiyat + VIP fiyat gösteriliyor mu?

5. **Cart VIP discount**:
   - Sepete ürün ekle
   - Sepette VIP indirimi hesaplanıyor mu?
   - Toplam doğru mu?

### C) Otomatik VIP Hesaplama

1. **Admin > Customers**: `/admin/customers`

2. **"Tümünü Hesapla"** butonuna tıkla

3. **Bekleyin** (birkaç saniye)

4. **Sonuçları kontrol**:
   - Müşterilere otomatik tier atandı mı?
   - Segment'ler doğru mu? (VIP, High-Potential, New, Passive, Standard)

### ✅ Başarı Kriterleri:
- Manuel VIP atama çalıştı ✅
- VIP badge görünüyor ✅
- VIP pricing aktif ✅
- Cart'ta discount hesaplanıyor ✅
- Otomatik hesaplama çalıştı ✅

---

## 🔄 TEST 4: Quote to Order Conversion (5 dakika)

### Onaylı Quote'u Siparişe Dönüştürme

1. **Müşteri login**: Onaylı quote'u olan müşteriyle

2. **Quotes sayfası**: `/account/quotes`

3. **Onaylı quote bul**:
   - Status: "Onaylandı" (Approved)

4. **"Sipariş Ver"** butonuna tıkla

5. **Checkout sayfası**:
   - Otomatik yönlendirme oldu mu?
   - Form otomatik dolu geldi mi? (ad, email, telefon, adres)
   - Ürünler doğru mu?

6. **Siparişi tamamla**:
   - Bilgileri kontrol et
   - **"Siparişi Onayla"** tıkla

7. **Kontrol**:
   - Sipariş oluşturuldu mu?
   - `/account/orders` - yeni sipariş var mı?
   - `/account/quotes` - quote status "Converted" oldu mu?

### ✅ Başarı Kriterleri:
- "Sipariş Ver" butonu görünüyor ✅
- Checkout'a yönlendirme çalıştı ✅
- Form otomatik dolu ✅
- Sipariş oluşturuldu ✅
- Quote status "Converted" oldu ✅

---

## 🎨 TEST 5: Sample (Numune) Sistemi (10 dakika)

### A) Numune Talebi

1. **Müşteri login**

2. **Sepete ürün ekle**

3. **"Numune Talep Et"** butonuna tıkla

4. **Formu doldur ve gönder**

5. **Kontrol**: `/account/samples` - numune var mı?

### B) Admin Numune Yönetimi

1. **Admin login**: `/admin/samples`

2. **Numune talepleri listesi**

3. **Status güncelleme**:
   - Talebi seç
   - Status değiştir:
     - Requested → Approved ✅
     - Approved → Preparing 📦
     - Preparing → Shipped 🚚 (tracking number ekle)
     - Shipped → Delivered ✅

4. **Email kontrolü**:
   - Approve edince email gitti mi?
   - Firestore > mail > delivery.state = SUCCESS?

### ✅ Başarı Kriterleri:
- Numune talebi oluşturuldu ✅
- Admin'de görünüyor ✅
- Status workflow çalışıyor ✅
- Email notification gönderildi ✅

---

## 🔍 Hata Kontrolleri

### Email Gönderilmedi?

**Firestore'da kontrol**:
- `mail` collection > dokümana git
- `delivery.state` = `ERROR` mi?
- `delivery.error` ne diyor?

**Yaygın hatalar**:
- `Authentication failed` → SMTP şifre yanlış
- `Connection timeout` → SMTP sunucu erişilemiyor
- `Invalid sender` → FROM email adresi yanlış

**Çözüm**:
1. Firebase Console > Extensions > firestore-send-email
2. **Reconfigure** tıkla
3. SMTP URI'yi kontrol et
4. Email şifresini yeniden gir

### VIP Discount Çalışmıyor?

**Kontrol**:
1. User'ın VIP tier'i var mı? (Firestore > users > document)
2. `vipStatus.tier` ve `vipStatus.discount` doğru mu?
3. Browser console'da hata var mı?
4. Logout/login dene (context refresh)

### PDF İndirilmiyor?

**Kontrol**:
1. Browser console'da hata var mı?
2. API URL doğru mu? (production: https://api-tfi7rlxtca-uc.a.run.app)
3. Quote ID doğru mu?
4. Network tab'da request başarılı mı?

---

## 📊 Test Sonuç Tablosu

Test tamamladıkça işaretleyin:

| Test | Durum | Notlar |
|------|-------|--------|
| ☐ Email sistemi | | |
| ☐ Quote talebi | | |
| ☐ Quote onaylama | | |
| ☐ PDF indirme | | |
| ☐ Quote email | | |
| ☐ VIP manuel atama | | |
| ☐ VIP badge display | | |
| ☐ VIP pricing | | |
| ☐ VIP otomatik hesaplama | | |
| ☐ Quote to order | | |
| ☐ Sample talebi | | |
| ☐ Sample onaylama | | |
| ☐ Sample email | | |

---

## 🎯 Başarı Kriterleri

Sistem %100 çalışıyor sayılır eğer:

✅ Email sistemi aktif (SUCCESS delivery state)
✅ Quote workflow tam (talep → onay → PDF → email)
✅ VIP sistemi çalışıyor (atama, pricing, display)
✅ Quote-to-order conversion çalışıyor
✅ Sample workflow tam
✅ Tüm admin sayfaları erişilebilir
✅ Tüm customer sayfaları erişilebilir
✅ Mobile responsive

---

## 📞 Sorun Yaşarsanız

1. **Firebase Console Logs**: https://console.firebase.google.com/project/svdfirebase000/functions
2. **Firestore Data**: https://console.firebase.google.com/project/svdfirebase000/firestore
3. **Extension Logs**: https://console.firebase.google.com/project/svdfirebase000/extensions
4. **Browser Console**: F12 > Console tab

---

## 🚀 Test Sonrası

Tüm testler başarılıysa:
1. ✅ Sistem production'a hazır!
2. 📊 Gerçek müşterilerle test edin
3. 📈 Firebase Analytics aktif edin
4. 🔔 Error monitoring kurun (Sentry)
5. 💰 Firebase billing alerts kurun

İyi testler! 🎉
