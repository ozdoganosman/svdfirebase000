# Email Extension Test Talimatları

## Kurulum Sonrası Test

Extension doğru bölge ile kurulduktan sonra bu adımları takip edin:

### 1. Extension Durumunu Kontrol Et

Terminalden çalıştır:
```bash
firebase ext:list
```

**Beklenen Çıktı:**
```
State: ACTIVE (ERRORED değil!)
```

### 2. Manuel Email Testi

Firebase Console'da test email gönderin:

1. **Firestore** > **Data** sekmesine gidin
2. **+ Start collection** tıklayın
3. Collection ID: `mail`
4. Document ID: **Auto-ID** (otomatik)
5. Aşağıdaki alanları ekleyin:

#### Test Email Dokümani:
```json
{
  "to": "KENDI-EMAIL-ADRESINIZ@gmail.com",
  "message": {
    "subject": "SVD Ambalaj - Email Sistemi Test",
    "text": "Bu bir test emailidir. Email sistemi çalışıyor!",
    "html": "<h1>SVD Ambalaj</h1><p>Email sistemi başarıyla kuruldu ve çalışıyor! 🎉</p>"
  }
}
```

6. **Save** tıklayın
7. **10-30 saniye bekleyin**
8. Email kutunuzu kontrol edin

### 3. Email Durumunu Kontrol Et

Email gönderdikten sonra:

1. Firestore'da az önce oluşturduğunuz dokümana geri dönün
2. Doküman otomatik güncellenmiş olmalı
3. Yeni `delivery` alanını kontrol edin:

**Başarılı Email:**
```json
{
  "to": "test@example.com",
  "message": { ... },
  "delivery": {
    "state": "SUCCESS",
    "startTime": "2025-10-26T...",
    "endTime": "2025-10-26T...",
    "info": {
      "messageId": "...",
      "accepted": ["test@example.com"]
    }
  }
}
```

**Başarısız Email:**
```json
{
  "delivery": {
    "state": "ERROR",
    "error": "Hata mesajı buraya gelir"
  }
}
```

### 4. Email Gelmezse

#### Olası Sorunlar:

**A) SMTP Şifre Hatası**
- SMTP connection URI'yi kontrol edin
- Email şifresinin doğru olduğundan emin olun
- Özel karakterleri URL encode edin (`@` → `%40`)

**B) Firestore Delivery Error**
Firestore'da `delivery.error` alanına bakın:
```
"Authentication failed" → Şifre yanlış
"Connection timeout" → SMTP sunucusu erişilemiyor
"Invalid sender" → FROM email adresi yanlış
```

**C) Extension Loglarını Kontrol**
1. Firebase Console > Extensions > firestore-send-email
2. **Logs** sekmesine gidin
3. Hata mesajlarını okuyun

---

## Test Başarılıysa: Gerçek Quote Email Testi

Email sistemi çalışıyorsa, gerçek teklif onay emailini test edin:

### Backend'den Email Gönderme Testi

1. Admin olarak login yapın
2. `/admin/quotes` sayfasına gidin
3. Bir teklifi onaylayın
4. Email otomatik gönderilecek
5. Müşteri emailini kontrol edin

### Beklenen Email:
- Konu: "Teklifiniz Onaylandı - SVD Ambalaj"
- PDF eki ile birlikte
- Profesyonel HTML formatında
- Ürün detayları ve fiyatlar

---

## Hala Sorun Varsa

### Debug Adımları:

1. **Extension tekrar kur**
   ```bash
   firebase ext:list
   # ERRORED görüyorsanız
   # Console'dan uninstall > reinstall
   ```

2. **SMTP ayarlarını doğrula**
   - Email client ile manuel test et (Outlook, Thunderbird)
   - SMTP: mail.spreyvalfdunyasi.com:465
   - Username: info@spreyvalfdunyasi.com
   - Password: Email şifreniz

3. **Natrohost desteğine sorun**
   - SMTP erişim kısıtlaması var mı?
   - Port 465 açık mı?
   - Email gönderim limiti var mı?

---

## Başarı Kriterleri

Extension doğru çalışıyorsa:
- ✅ `firebase ext:list` → State: ACTIVE
- ✅ Manuel test email gönderimi başarılı
- ✅ Firestore'da delivery.state = SUCCESS
- ✅ Email kutusuna email geldi
- ✅ Quote onayında otomatik email gönderiliyor
- ✅ PDF eki emailde görünüyor

Hepsi başarılıysa → Email sistemi tamamen çalışıyor! 🎉
