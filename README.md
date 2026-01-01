# Sprey Valf Dünyası - B2B E-Ticaret Platformu

Kozmetik, medikal ve hijyen sektörleri için toptan ambalaj ürünleri satan B2B e-ticaret platformu.

## Canlı Site

**https://spreyvalfdunyasi.com**

## Özellikler

### Ürün Yönetimi
- Sprey başlıkları, krem pompaları, kapaklar, PET şişeler, damlalıklar
- Varyant desteği (renk, ağız ölçüsü: 18/410, 24/410, 43/410)
- Kademeli toplu alım fiyatlandırması (çok al az öde)
- Kombo indirimi (%10 - aynı ağız ölçüsünde başlık+şişe)

### Sipariş Sistemi
- Sepet ve teklif oluşturma
- Numune talep sistemi
- Mesafeli satış sözleşmesi onayı
- KVKK uyumlu gizlilik politikası

### Admin Paneli
- Ürün ve kategori yönetimi
- Sipariş takibi
- Müşteri yönetimi
- Landing page içerik düzenleyici
- Medya yükleyici (2GB memory limit)
- Döviz kuru entegrasyonu (TCMB)
- Site ayarları ve e-posta yapılandırması

### Teknik Özellikler
- Next.js 15 (App Router)
- Firebase (Hosting, Functions, Firestore, Storage)
- TypeScript
- Tailwind CSS
- Responsive tasarım

## Proje Yapısı

```
svdfirebase000/
├── functions/           # Firebase Cloud Functions (API)
│   ├── src/
│   │   ├── routes/     # API endpoint'leri
│   │   └── services/   # İş mantığı servisleri
│   └── index.js        # Functions giriş noktası
│
└── svd-ambalaj/
    └── svd-ambalaj-frontend/   # Next.js Frontend
        ├── src/
        │   ├── app/            # Sayfa route'ları
        │   ├── components/     # React bileşenleri
        │   ├── context/        # React context'ler
        │   └── lib/            # Yardımcı fonksiyonlar
        └── public/             # Statik dosyalar
```

## Kurulum

### Gereksinimler
- Node.js 20
- Firebase CLI
- npm veya yarn

### Adımlar

1. Repoyu klonlayın:
```bash
git clone https://github.com/ozdoganosman/svdfirebase000.git
cd svdfirebase000
```

2. Frontend bağımlılıklarını yükleyin:
```bash
cd svd-ambalaj/svd-ambalaj-frontend
npm install
```

3. Functions bağımlılıklarını yükleyin:
```bash
cd ../../functions
npm install
```

4. Ortam değişkenlerini ayarlayın:
```bash
# svd-ambalaj/svd-ambalaj-frontend/.env.local
NEXT_PUBLIC_API_BASE=https://your-api-url.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
# ... diğer Firebase config değerleri
```

5. Development sunucusunu başlatın:
```bash
cd svd-ambalaj/svd-ambalaj-frontend
npm run dev
```

## Deploy

### Firebase'e Deploy
```bash
cd svd-ambalaj/svd-ambalaj-frontend
npm run build
npx firebase deploy --only hosting
```

### Functions Deploy
```bash
cd functions
npx firebase deploy --only functions
```

## API Endpoints

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/products` | Ürün listesi |
| `GET /api/products/:slug` | Ürün detayı |
| `GET /api/categories` | Kategori listesi |
| `GET /api/exchange-rate` | Güncel döviz kuru |
| `POST /api/orders` | Sipariş oluştur |
| `POST /api/sample-requests` | Numune talebi |
| `GET /api/landing-content` | Ana sayfa içeriği |

## Yasal Sayfalar

- `/gizlilik-politikasi` - KVKK Aydınlatma Metni
- `/mesafeli-satis-sozlesmesi` - Mesafeli Satış Sözleşmesi
- `/kullanim-kosullari` - Kullanım Koşulları
- `/cerez-politikasi` - Çerez Politikası

## Lisans

Bu proje özel mülkiyettir. Tüm hakları saklıdır.

---

**SVD AMBALAJ PLASTİK OTO.İNŞ.SAN.TİCARET LTD.ŞTİ**
İvedik OSB 1354, Yenimahalle/Ankara
Tel: (312) 395 67 27
E-posta: lastik_jantevi@hotmail.com
