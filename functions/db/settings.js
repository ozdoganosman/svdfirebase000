/**
 * Settings Database Operations
 * Handles siteSettings, content, and other configuration collections
 */

import { db } from "./client.js";
import { FieldValue } from "firebase-admin/firestore";

// Collection references
const siteSettingsCollection = db.collection("siteSettings");
const contentCollection = db.collection("content");

// Helper to map timestamps
const mapTimestamp = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(value).toISOString();
};

// ==================== SITE SETTINGS ====================

/**
 * Get site settings by section
 * @param {string} section - Settings section (pricing, site, email, payment, seo)
 */
export const getSiteSettings = async (section) => {
  const doc = await siteSettingsCollection.doc(section).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    section,
    ...data,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

/**
 * Get all site settings
 */
export const getAllSiteSettings = async () => {
  const snapshot = await siteSettingsCollection.get();
  const settings = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    settings[doc.id] = {
      section: doc.id,
      ...data,
      createdAt: mapTimestamp(data.createdAt),
      updatedAt: mapTimestamp(data.updatedAt),
    };
  });

  return settings;
};

/**
 * Create or update site settings
 * @param {string} section - Settings section
 * @param {Object} data - Settings data
 * @param {string} userId - User making the change
 */
export const setSiteSettings = async (section, data, userId = "system") => {
  const now = FieldValue.serverTimestamp();
  const docRef = siteSettingsCollection.doc(section);
  const existingDoc = await docRef.get();

  const settingsData = {
    ...data,
    updatedAt: now,
    updatedBy: userId,
  };

  if (!existingDoc.exists) {
    settingsData.createdAt = now;
    settingsData.createdBy = userId;
  }

  await docRef.set(settingsData, { merge: true });

  // Log the change
  await logSettingsChange(section, "site", data, userId);

  return getSiteSettings(section);
};

/**
 * Initialize default site settings if not exists
 */
export const initializeSiteSettings = async () => {
  const defaultSettings = {
    pricing: {
      currency: "TRY",
      taxRate: 20, // 20% KDV
      showPricesWithTax: true,
      allowGuestCheckout: false,
    },
    site: {
      siteName: "SVD Ambalaj",
      siteDescription: "Kaliteli ambalaj ürünleri",
      supportEmail: "info@svdambalaj.com",
      supportPhone: "+90 XXX XXX XX XX",
      maintenanceMode: false,
      // Logo
      logoUrl: "",
      logoAlt: "SVD Ambalaj Logo",
      faviconUrl: "",
      // Address
      address: "",
      city: "",
      district: "",
      postalCode: "",
      country: "Türkiye",
      mapUrl: "",
      // Social Media
      socialMedia: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        youtube: "",
        tiktok: "",
        whatsapp: "",
      },
      // Working Hours
      workingHours: "09:00 - 18:00",
      workingDays: "Pazartesi - Cumartesi",
    },
    email: {
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: true,
      smtpUser: "",
      smtpPassword: "", // Should be encrypted
      fromEmail: "noreply@svdambalaj.com",
      fromName: "SVD Ambalaj",
    },
    payment: {
      paytrMerchantId: "",
      paytrMerchantKey: "", // Should be encrypted
      paytrMerchantSalt: "", // Should be encrypted
      paytrEnabled: false,
    },
    seo: {
      defaultTitle: "SVD Ambalaj - Kaliteli Ambalaj Ürünleri",
      defaultDescription: "Şişe, başlık ve daha fazlası için profesyonel ambalaj çözümleri",
      defaultKeywords: "ambalaj, şişe, başlık, pet şişe",
      googleAnalyticsId: "",
      facebookPixelId: "",
    },
    stock: {
      lowStockThreshold: 100,
      criticalStockThreshold: 20,
      allowZeroStockOrders: false,
      notifyOnLowStock: true,
      notifyEmail: "",
    },
  };

  const results = {};
  for (const [section, data] of Object.entries(defaultSettings)) {
    const existing = await getSiteSettings(section);
    if (!existing) {
      results[section] = await setSiteSettings(section, data, "system");
    } else {
      results[section] = existing;
    }
  }

  return results;
};

// ==================== CONTENT MANAGEMENT ====================

/**
 * Get content by section
 */
export const getContent = async (section) => {
  const doc = await contentCollection.doc(section).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    section,
    ...data,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

/**
 * Get all content
 */
export const getAllContent = async () => {
  const snapshot = await contentCollection.get();
  const content = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    content[doc.id] = {
      section: doc.id,
      ...data,
      createdAt: mapTimestamp(data.createdAt),
      updatedAt: mapTimestamp(data.updatedAt),
    };
  });

  return content;
};

/**
 * Set content for a section
 */
export const setContent = async (section, data, userId = "system") => {
  const now = FieldValue.serverTimestamp();
  const docRef = contentCollection.doc(section);
  const existingDoc = await docRef.get();

  const contentData = {
    ...data,
    updatedAt: now,
    updatedBy: userId,
  };

  if (!existingDoc.exists) {
    contentData.createdAt = now;
    contentData.createdBy = userId;
  }

  await docRef.set(contentData, { merge: true });
  return getContent(section);
};

// ==================== EMAIL TEMPLATES ====================

const emailTemplatesCollection = db.collection("emailTemplates");

/**
 * Default email templates - used if no custom template exists
 */
const defaultEmailTemplates = {
  quoteApproved: {
    id: "quoteApproved",
    name: "Teklif Onaylandı",
    description: "Teklif onaylandığında müşteriye gönderilen e-posta",
    subject: "Teklifiniz Onaylandı - {{quoteNumber}}",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{siteName}}</h1>
      <p>Teklif Onay Bildirimi</p>
    </div>
    <div class="content">
      <h2>🎉 Teklifiniz Onaylandı!</h2>
      <div class="info-box">
        <p><strong>Teklif No:</strong> {{quoteNumber}}</p>
        <p><strong>Tarih:</strong> {{createdAt}}</p>
        {{#if validUntil}}<p><strong>Geçerlilik:</strong> {{validUntil}} tarihine kadar</p>{{/if}}
      </div>
      <p>Sayın {{customerName}},</p>
      <p>Teklif talebiniz incelenmiş ve onaylanmıştır. Teklif detaylarını ekteki PDF dosyasında bulabilirsiniz.</p>
      <p style="font-size: 18px; font-weight: bold; text-align: right;">
        Toplam: {{total}}
      </p>
      {{#if adminNotes}}
      <div class="info-box">
        <p><strong>Not:</strong></p>
        <p>{{adminNotes}}</p>
      </div>
      {{/if}}
      <a href="{{quotesUrl}}" class="button">Tekliflerimi Görüntüle</a>
    </div>
    <div class="footer">
      <p>{{siteName}} - {{siteDescription}}</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Sayın {{customerName}},

Teklifiniz onaylanmıştır!

Teklif No: {{quoteNumber}}
Tarih: {{createdAt}}
Toplam: {{total}}

Teklif detaylarını ekteki PDF dosyasında bulabilirsiniz.

{{siteName}}`,
    variables: ["siteName", "siteDescription", "quoteNumber", "createdAt", "validUntil", "customerName", "total", "adminNotes", "quotesUrl"],
  },
  quoteRejected: {
    id: "quoteRejected",
    name: "Teklif Reddedildi",
    description: "Teklif reddedildiğinde müşteriye gönderilen e-posta",
    subject: "Teklif Talebiniz Hakkında - {{quoteNumber}}",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .info-box { background-color: white; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{siteName}}</h1>
      <p>Teklif Bildirim</p>
    </div>
    <div class="content">
      <h2>Teklif Talebiniz Hakkında</h2>
      <div class="info-box">
        <p><strong>Teklif No:</strong> {{quoteNumber}}</p>
        <p><strong>Tarih:</strong> {{createdAt}}</p>
      </div>
      <p>Sayın {{customerName}},</p>
      <p>Teklif talebiniz incelenmiştir. Üzgünüz, mevcut durumda bu teklifi karşılayamıyoruz.</p>
      {{#if adminNotes}}
      <div class="info-box">
        <p><strong>Açıklama:</strong></p>
        <p>{{adminNotes}}</p>
      </div>
      {{/if}}
      <p>Farklı ürünler veya miktarlar için yeni bir teklif talebi oluşturabilirsiniz.</p>
    </div>
    <div class="footer">
      <p>{{siteName}} - {{siteDescription}}</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Sayın {{customerName}},

Teklif talebiniz hakkında:

Teklif No: {{quoteNumber}}
Tarih: {{createdAt}}

Üzgünüz, mevcut durumda bu teklifi karşılayamıyoruz.
{{#if adminNotes}}Açıklama: {{adminNotes}}{{/if}}

Farklı ürünler için yeni teklif talebi oluşturabilirsiniz.

{{siteName}}`,
    variables: ["siteName", "siteDescription", "quoteNumber", "createdAt", "customerName", "adminNotes"],
  },
  sampleApproved: {
    id: "sampleApproved",
    name: "Numune Onaylandı",
    description: "Numune talebi onaylandığında müşteriye gönderilen e-posta",
    subject: "Numune Talebiniz Onaylandı - {{sampleNumber}}",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .info-box { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{siteName}}</h1>
      <p>Numune Onay Bildirimi</p>
    </div>
    <div class="content">
      <h2>🎉 Numune Talebiniz Onaylandı!</h2>
      <div class="info-box">
        <p><strong>Numune No:</strong> {{sampleNumber}}</p>
        <p><strong>Tarih:</strong> {{createdAt}}</p>
        <p><strong>Kargo Ücreti:</strong> {{shippingFee}} (KDV Dahil)</p>
      </div>
      <p>Sayın {{customerName}},</p>
      <p>Numune talebiniz onaylanmıştır. Ürünleriniz hazırlanıyor ve en kısa sürede kargoya verilecektir.</p>
      <p>Kargo takip numarası oluşturulduğunda size bildirilecektir.</p>
    </div>
    <div class="footer">
      <p>{{siteName}} - {{siteDescription}}</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Sayın {{customerName}},

Numune talebiniz onaylanmıştır!

Numune No: {{sampleNumber}}
Tarih: {{createdAt}}
Kargo Ücreti: {{shippingFee}} (KDV Dahil)

Kargo takip numarası oluşturulduğunda size bildirilecektir.

{{siteName}}`,
    variables: ["siteName", "siteDescription", "sampleNumber", "createdAt", "customerName", "shippingFee"],
  },
  newQuoteAdmin: {
    id: "newQuoteAdmin",
    name: "Yeni Teklif (Admin)",
    description: "Yeni teklif talebi geldiğinde admin'e gönderilen e-posta",
    subject: "Yeni Teklif Talebi - {{quoteNumber}}",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Yeni Teklif Talebi</h1>
    </div>
    <div class="content">
      <p><strong>Teklif No:</strong> {{quoteNumber}}</p>
      <p><strong>Müşteri:</strong> {{customerName}} {{#if customerCompany}}({{customerCompany}}){{/if}}</p>
      <p><strong>E-posta:</strong> {{customerEmail}}</p>
      <p><strong>Telefon:</strong> {{customerPhone}}</p>
      <p style="font-size: 18px; font-weight: bold;">Toplam: {{total}}</p>
      <a href="{{adminQuotesUrl}}" class="button">Admin Panelinde Görüntüle</a>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Yeni Teklif Talebi

Teklif No: {{quoteNumber}}
Müşteri: {{customerName}} {{#if customerCompany}}({{customerCompany}}){{/if}}
E-posta: {{customerEmail}}
Telefon: {{customerPhone}}

Toplam: {{total}}

Admin panelinde görüntüle: {{adminQuotesUrl}}`,
    variables: ["quoteNumber", "customerName", "customerCompany", "customerEmail", "customerPhone", "total", "adminQuotesUrl"],
  },
  newSampleAdmin: {
    id: "newSampleAdmin",
    name: "Yeni Numune (Admin)",
    description: "Yeni numune talebi geldiğinde admin'e gönderilen e-posta",
    subject: "Yeni Numune Talebi - {{sampleNumber}}",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Yeni Numune Talebi</h1>
    </div>
    <div class="content">
      <p><strong>Numune No:</strong> {{sampleNumber}}</p>
      <p><strong>Müşteri:</strong> {{customerName}} {{#if customerCompany}}({{customerCompany}}){{/if}}</p>
      <p><strong>E-posta:</strong> {{customerEmail}}</p>
      <p><strong>Telefon:</strong> {{customerPhone}}</p>
      <p><strong>Kargo Ücreti:</strong> {{shippingFee}} (KDV Dahil)</p>
      {{#if notes}}<p><strong>Müşteri Notu:</strong> {{notes}}</p>{{/if}}
      <a href="{{adminSamplesUrl}}" class="button">Admin Panelinde Görüntüle</a>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Yeni Numune Talebi

Numune No: {{sampleNumber}}
Müşteri: {{customerName}} {{#if customerCompany}}({{customerCompany}}){{/if}}
E-posta: {{customerEmail}}
Telefon: {{customerPhone}}

Kargo Ücreti: {{shippingFee}} (KDV Dahil)

{{#if notes}}Müşteri Notu: {{notes}}{{/if}}

Admin panelinde görüntüle: {{adminSamplesUrl}}`,
    variables: ["sampleNumber", "customerName", "customerCompany", "customerEmail", "customerPhone", "shippingFee", "notes", "adminSamplesUrl"],
  },
  orderConfirmation: {
    id: "orderConfirmation",
    name: "Sipariş Onayı",
    description: "Sipariş oluşturulduğunda müşteriye gönderilen e-posta",
    subject: "✅ Siparişiniz Alındı - #{{orderNumber}}",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f3f4f6; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{siteName}}</h1>
      <p>Sipariş Onayı</p>
    </div>
    <div class="content">
      <h2>🎉 Siparişiniz Alındı!</h2>
      <div class="info-box">
        <p><strong>Sipariş No:</strong> {{orderNumber}}</p>
        <p><strong>Tarih:</strong> {{createdAtFormatted}}</p>
        <p><strong>Durum:</strong> {{statusText}}</p>
      </div>
      <p>Sayın {{customerName}},</p>
      <p>Siparişinizi aldık! Satış ekibimiz siparişinizi inceleyecek ve en kısa sürede sizinle iletişime geçecektir.</p>
      <h3>Sipariş Detayları:</h3>
      <table>
        <thead>
          <tr><th>Ürün</th><th>Miktar</th><th>Fiyat</th></tr>
        </thead>
        <tbody>
          {{#each itemsFormatted}}<tr><td>{{this.title}}</td><td>{{this.quantity}} adet</td><td>{{this.subtotalFormatted}}</td></tr>{{/each}}
        </tbody>
      </table>
      <p style="font-size: 18px; font-weight: bold; text-align: right;">Toplam: {{totalFormatted}}</p>
      {{#if deliveryAddress}}
      <div class="info-box">
        <p><strong>Teslimat Adresi:</strong></p>
        <p>{{deliveryAddress}}</p>
        <p>{{deliveryCity}}</p>
      </div>
      {{/if}}
      <a href="{{ordersUrl}}" class="button">Siparişlerimi Görüntüle</a>
    </div>
    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Sayın {{customerName}},

Siparişinizi aldık!

Sipariş No: {{orderNumber}}
Tarih: {{createdAtFormatted}}
Durum: {{statusText}}

Toplam: {{totalFormatted}}

Teslimat Adresi:
{{deliveryAddress}}
{{deliveryCity}}

Siparişlerinizi görüntülemek için: {{ordersUrl}}

{{siteName}}`,
    variables: ["siteName", "orderNumber", "createdAtFormatted", "statusText", "customerName", "itemsFormatted", "subtotalFormatted", "totalFormatted", "deliveryAddress", "deliveryCity", "ordersUrl"],
  },
  orderStatus: {
    id: "orderStatus",
    name: "Sipariş Durumu",
    description: "Sipariş durumu değiştiğinde müşteriye gönderilen e-posta",
    subject: "📦 Sipariş Durumu Güncellendi - #{{orderNumber}}",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
    .header.shipped { background-color: #8b5cf6; }
    .header.delivered { background-color: #10b981; }
    .header.cancelled { background-color: #ef4444; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background-color: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header {{statusClass}}">
      <h1>{{siteName}}</h1>
      <p>Sipariş Durum Güncellemesi</p>
    </div>
    <div class="content">
      <h2>{{statusEmoji}} Sipariş Durumu Güncellendi</h2>
      <div class="info-box">
        <p><strong>Sipariş No:</strong> {{orderNumber}}</p>
        <p><strong>Yeni Durum:</strong> {{statusText}}</p>
        <p><strong>Güncelleme Tarihi:</strong> {{updatedAtFormatted}}</p>
      </div>
      <p>Sayın {{customerName}},</p>
      <p>{{statusMessage}}</p>
      {{#if hasTrackingNumber}}
      <div class="info-box">
        <p><strong>Kargo Takip No:</strong> {{trackingNumber}}</p>
        {{#if trackingUrl}}<p><a href="{{trackingUrl}}">Kargonuzu Takip Edin</a></p>{{/if}}
      </div>
      {{/if}}
      {{#if hasAdminNotes}}
      <div class="info-box">
        <p><strong>Not:</strong></p>
        <p>{{adminNotes}}</p>
      </div>
      {{/if}}
      <a href="{{ordersUrl}}" class="button">Siparişimi Görüntüle</a>
    </div>
    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Sayın {{customerName}},

Siparişinizin durumu güncellendi!

Sipariş No: {{orderNumber}}
Yeni Durum: {{statusText}}
Güncelleme Tarihi: {{updatedAtFormatted}}

{{statusMessage}}

{{#if hasTrackingNumber}}Kargo Takip No: {{trackingNumber}}{{/if}}

{{#if hasAdminNotes}}Not: {{adminNotes}}{{/if}}

Siparişinizi görüntülemek için: {{ordersUrl}}

{{siteName}}`,
    variables: ["siteName", "orderNumber", "status", "statusText", "statusEmoji", "statusClass", "statusMessage", "updatedAtFormatted", "customerName", "trackingNumber", "trackingUrl", "hasTrackingNumber", "adminNotes", "hasAdminNotes", "ordersUrl"],
  },
  welcome: {
    id: "welcome",
    name: "Hoş Geldin",
    description: "Yeni kullanıcı kaydolduğunda gönderilen e-posta",
    subject: "🎉 {{siteName}} Ailesine Hoş Geldiniz!",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f59e0b; color: white; padding: 30px 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .feature-box { background-color: white; border-radius: 8px; padding: 15px; margin: 10px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{siteName}}'a Hoş Geldiniz!</h1>
      <p>🎉 Hesabınız başarıyla oluşturuldu</p>
    </div>
    <div class="content">
      <p>Merhaba {{userName}},</p>
      <p>{{siteName}} ailesine katıldığınız için teşekkür ederiz! Artık tüm hizmetlerimizden yararlanabilirsiniz.</p>
      <h3>Sizin İçin Neler Yapabiliriz?</h3>
      <div class="feature-box">
        <p><strong>🛒 Online Sipariş</strong> - 7/24 sipariş verin</p>
      </div>
      <div class="feature-box">
        <p><strong>📋 Teklif Talebi</strong> - Özel fiyat alın</p>
      </div>
      <div class="feature-box">
        <p><strong>📦 Numune Talebi</strong> - Ürünleri deneyin</p>
      </div>
      <p style="text-align: center; margin-top: 20px;">
        <a href="{{siteUrl}}/products" class="button">Ürünleri Keşfet</a>
        <a href="{{siteUrl}}/account" class="button" style="background-color: #6b7280;">Hesabım</a>
      </p>
    </div>
    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta, hesap oluşturduğunuz için gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Merhaba {{userName}},

{{siteName}} ailesine hoş geldiniz!

Hesabınız başarıyla oluşturuldu. Artık tüm hizmetlerimizden yararlanabilirsiniz:

- Online Sipariş: 7/24 sipariş verin
- Teklif Talebi: Özel fiyatlar alın
- Numune Talebi: Ürünleri deneyin

Ürünleri keşfetmek için: {{siteUrl}}/products
Hesabınız: {{siteUrl}}/account

{{siteName}}`,
    variables: ["siteName", "siteUrl", "userName", "userEmail", "currentYear"],
  },
  newOrderAdmin: {
    id: "newOrderAdmin",
    name: "Yeni Sipariş (Admin)",
    description: "Yeni sipariş oluşturulduğunda admin'e gönderilen e-posta",
    subject: "🛒 Yeni Sipariş - #{{orderNumber}}",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f3f4f6; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Yeni Sipariş!</h1>
      <p>Sipariş No: {{orderNumber}}</p>
    </div>
    <div class="content">
      <div class="info-box">
        <h3>Müşteri Bilgileri</h3>
        <p><strong>Ad Soyad:</strong> {{customerName}}</p>
        {{#if customerCompany}}<p><strong>Firma:</strong> {{customerCompany}}</p>{{/if}}
        <p><strong>E-posta:</strong> {{customerEmail}}</p>
        <p><strong>Telefon:</strong> {{customerPhone}}</p>
      </div>
      <h3>Sipariş Detayları</h3>
      <table>
        <thead>
          <tr><th>Ürün</th><th>Miktar</th><th>Fiyat</th></tr>
        </thead>
        <tbody>
          {{#each itemsFormatted}}<tr><td>{{this.title}}</td><td>{{this.quantity}} adet</td><td>{{this.subtotalFormatted}}</td></tr>{{/each}}
        </tbody>
      </table>
      <p style="font-size: 20px; font-weight: bold; text-align: right; color: #10b981;">
        Toplam: {{totalFormatted}}
      </p>
      <a href="{{adminOrdersUrl}}" class="button">Admin Panelinde Görüntüle</a>
    </div>
    <div class="footer">
      <p>{{siteName}} - Sipariş Yönetim Sistemi</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `YENİ SİPARİŞ

Sipariş No: {{orderNumber}}

Müşteri Bilgileri:
- Ad Soyad: {{customerName}}
{{#if customerCompany}}- Firma: {{customerCompany}}{{/if}}
- E-posta: {{customerEmail}}
- Telefon: {{customerPhone}}

Toplam: {{totalFormatted}}

Admin panelinde görüntüle: {{adminOrdersUrl}}

{{siteName}}`,
    variables: ["siteName", "orderNumber", "customerName", "customerCompany", "customerEmail", "customerPhone", "itemsFormatted", "totalFormatted", "adminOrdersUrl"],
  },
  stockAlert: {
    id: "stockAlert",
    name: "Stok Uyarısı (Admin)",
    description: "Stok seviyesi düşük olduğunda admin'e gönderilen e-posta",
    subject: "🚨 Stok Uyarısı - {{totalAlerts}} ürün dikkat gerektiriyor",
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
    .header.warning { background-color: #f59e0b; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .critical { color: #ef4444; font-weight: bold; }
    .low { color: #f59e0b; font-weight: bold; }
    .summary-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header {{alertClass}}">
      <h1>{{alertEmoji}} Stok Uyarısı</h1>
      <p>{{alertTitle}}</p>
    </div>
    <div class="content">
      <div class="summary-box">
        <h3>Özet</h3>
        <p><strong>Stokta Yok:</strong> {{outOfStockCount}} ürün</p>
        <p><strong>Kritik Seviye:</strong> {{criticalCount}} ürün</p>
        <p><strong>Düşük Seviye:</strong> {{lowCount}} ürün</p>
        <p><strong>Toplam Uyarı:</strong> {{totalAlerts}} ürün</p>
      </div>
      {{#if hasOutOfStock}}
      <h3 class="critical">🚫 Stokta Olmayan Ürünler</h3>
      <table>
        <thead><tr><th>Ürün</th><th>Stok</th></tr></thead>
        <tbody>{{#each outOfStock}}<tr><td>{{this.title}}</td><td class="critical">0</td></tr>{{/each}}</tbody>
      </table>
      {{/if}}
      {{#if hasCritical}}
      <h3 class="critical">🚨 Kritik Stok Seviyesi</h3>
      <table>
        <thead><tr><th>Ürün</th><th>Stok</th></tr></thead>
        <tbody>{{#each critical}}<tr><td>{{this.title}}</td><td class="critical">{{this.stock}} adet</td></tr>{{/each}}</tbody>
      </table>
      {{/if}}
      {{#if hasLow}}
      <h3 class="low">⚠️ Düşük Stok Seviyesi</h3>
      <table>
        <thead><tr><th>Ürün</th><th>Stok</th></tr></thead>
        <tbody>{{#each low}}<tr><td>{{this.title}}</td><td class="low">{{this.stock}} adet</td></tr>{{/each}}</tbody>
      </table>
      {{/if}}
      <a href="{{adminProductsUrl}}" class="button">Ürünleri Yönet</a>
    </div>
    <div class="footer">
      <p>{{siteName}} - Stok Yönetim Sistemi</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `STOK UYARISI - {{alertTitle}}

Özet:
- Stokta Yok: {{outOfStockCount}} ürün
- Kritik Seviye: {{criticalCount}} ürün
- Düşük Seviye: {{lowCount}} ürün
- Toplam Uyarı: {{totalAlerts}} ürün

{{#if hasOutOfStock}}
STOKTA OLMAYAN ÜRÜNLER:
{{#each outOfStock}}- {{this.title}}: 0 adet
{{/each}}
{{/if}}

{{#if hasCritical}}
KRİTİK STOK SEVİYESİ:
{{#each critical}}- {{this.title}}: {{this.stock}} adet
{{/each}}
{{/if}}

{{#if hasLow}}
DÜŞÜK STOK SEVİYESİ:
{{#each low}}- {{this.title}}: {{this.stock}} adet
{{/each}}
{{/if}}

Ürünleri yönetmek için: {{adminProductsUrl}}

{{siteName}}`,
    variables: ["siteName", "alertEmoji", "alertTitle", "alertClass", "outOfStockCount", "criticalCount", "lowCount", "totalAlerts", "hasOutOfStock", "hasCritical", "hasLow", "outOfStock", "critical", "low", "adminProductsUrl"],
  },
};

/**
 * Get email template by ID
 */
export const getEmailTemplate = async (templateId) => {
  const doc = await emailTemplatesCollection.doc(templateId).get();

  if (!doc.exists) {
    // Return default template if no custom template exists
    return defaultEmailTemplates[templateId] || null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

/**
 * Get all email templates
 */
export const getAllEmailTemplates = async () => {
  const snapshot = await emailTemplatesCollection.get();
  const customTemplates = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    customTemplates[doc.id] = {
      id: doc.id,
      ...data,
      createdAt: mapTimestamp(data.createdAt),
      updatedAt: mapTimestamp(data.updatedAt),
    };
  });

  // Merge with defaults - custom templates override defaults
  const templates = {};
  for (const [key, defaultTemplate] of Object.entries(defaultEmailTemplates)) {
    templates[key] = customTemplates[key] || defaultTemplate;
  }

  return templates;
};

/**
 * Update email template
 */
export const updateEmailTemplate = async (templateId, data, userId = "system") => {
  const now = FieldValue.serverTimestamp();
  const docRef = emailTemplatesCollection.doc(templateId);
  const existingDoc = await docRef.get();

  const templateData = {
    ...data,
    id: templateId,
    updatedAt: now,
    updatedBy: userId,
  };

  if (!existingDoc.exists) {
    templateData.createdAt = now;
    templateData.createdBy = userId;
  }

  await docRef.set(templateData, { merge: true });

  // Log the change
  await logSettingsChange(templateId, "email_template", data, userId);

  return getEmailTemplate(templateId);
};

/**
 * Reset email template to default
 */
export const resetEmailTemplate = async (templateId, userId = "system") => {
  const defaultTemplate = defaultEmailTemplates[templateId];
  if (!defaultTemplate) {
    throw new Error("Template not found");
  }

  // Delete custom template to revert to default
  await emailTemplatesCollection.doc(templateId).delete();

  // Log the reset
  await logSettingsChange(templateId, "email_template_reset", { reset: true }, userId);

  return defaultTemplate;
};

// ==================== LANDING PAGE CONTENT ====================

const landingContentCollection = db.collection("landingContent");

/**
 * Default landing page content
 */
const defaultLandingContent = {
  hero: {
    badge: "B2B Ambalaj Çözümleri",
    title: "Sprey, Pompa ve PET Şişe",
    titleHighlight: "Toptan Satış",
    description: "Kozmetik, temizlik ve kişisel bakım sektörü için kaliteli ambalaj ürünleri. Toplu alımlarda özel fiyatlar.",
    primaryButton: { text: "Ürünleri İncele", href: "/products" },
    secondaryButton: { text: "Teklif Al", href: "/cart" },
    stats: [
      { value: "24", label: "Ülkeye İhracat" },
    ],
  },
  advantages: [
    { icon: "🔄", title: "Kombo İndirimi", description: "Başlık + Şişe birlikte alana %10 indirim", highlight: "%10" },
    { icon: "📦", title: "Toplu Alım Avantajı", description: "Adet arttıkça birim fiyat düşer", highlight: "Kademeli Fiyat" },
    { icon: "🚚", title: "Hızlı Kargo", description: "50.000+ adet siparişlerde ücretsiz kargo", highlight: "Ücretsiz" },
    { icon: "💳", title: "Güvenli Ödeme", description: "Kredi kartı ve havale ile ödeme", highlight: "3D Secure" },
  ],
  howItWorks: {
    title: "Nasıl Çalışır?",
    subtitle: "Toplu alım avantajlarından yararlanın",
    cards: [
      {
        icon: "🔄",
        color: "amber",
        title: "Kombo İndirimi",
        subtitle: "%10 Anında İndirim",
        description: "Aynı ağız ölçüsüne sahip başlık + şişe birlikte aldığınızda otomatik %10 indirim!",
        example: "24/410 başlık + 24/410 şişe = Her iki üründe %10 indirim",
      },
      {
        icon: "📊",
        color: "blue",
        title: "Kademeli Fiyat",
        subtitle: "Çok Al Az Öde",
        description: "Sipariş miktarı arttıkça birim fiyat düşer. Her ürünün fiyat tablosunu inceleyin.",
        example: "5 koli = ₺2.50/adet → 20 koli = ₺2.10/adet",
      },
      {
        icon: "🚚",
        color: "green",
        title: "Kargo",
        subtitle: "50.000+ Adet Ücretsiz",
        description: "50.000 adet ve üzeri siparişlerde Türkiye geneli ücretsiz kargo.",
        example: "Altında: Koli başına ₺120 kargo ücreti uygulanır",
      },
    ],
  },
  cta: {
    title: "Toplu Sipariş mi Vermek İstiyorsunuz?",
    description: "Özel fiyat teklifi için sepetinizi doldurun veya bizimle iletişime geçin.",
    primaryButton: { text: "Teklif Oluştur", href: "/cart" },
    secondaryButton: { text: "İletişime Geç", href: "mailto:info@svdambalaj.com" },
  },
  trustBadges: [
    { icon: "🏭", text: "1998'den Beri" },
    { icon: "🌍", text: "24 Ülkeye İhracat" },
    { icon: "✅", text: "ISO 9001:2015" },
    { icon: "🔒", text: "Güvenli Ödeme" },
    { icon: "📞", text: "7/24 Destek" },
  ],
  sections: {
    categoriesTitle: "Kategoriler",
    categoriesSubtitle: "İhtiyacınıza uygun ürünleri keşfedin",
    productsTitle: "Öne Çıkan Ürünler",
    productsSubtitle: "En çok tercih edilen ürünlerimiz",
  },
  // Featured products - array of product IDs (empty = show first 8)
  featuredProducts: [],
  // Section order - defines the order of sections on homepage
  sectionOrder: ["hero", "advantages", "categories", "howItWorks", "products", "cta", "trustBadges"],
};

/**
 * Get landing page content
 */
export const getLandingContent = async () => {
  const doc = await landingContentCollection.doc("main").get();

  if (!doc.exists) {
    return defaultLandingContent;
  }

  const data = doc.data();
  return {
    ...defaultLandingContent,
    ...data,
    updatedAt: mapTimestamp(data.updatedAt),
  };
};

/**
 * Update landing page content
 */
export const updateLandingContent = async (section, data, userId = "system") => {
  const now = FieldValue.serverTimestamp();
  const docRef = landingContentCollection.doc("main");
  const existingDoc = await docRef.get();

  const updateData = {
    [section]: data,
    updatedAt: now,
    updatedBy: userId,
  };

  if (!existingDoc.exists) {
    updateData.createdAt = now;
    updateData.createdBy = userId;
  }

  await docRef.set(updateData, { merge: true });

  // Log the change
  await logSettingsChange(`landing_${section}`, "landing_content", data, userId);

  return getLandingContent();
};

/**
 * Update entire landing page content
 */
export const setLandingContent = async (data, userId = "system") => {
  const now = FieldValue.serverTimestamp();
  const docRef = landingContentCollection.doc("main");
  const existingDoc = await docRef.get();

  const contentData = {
    ...data,
    updatedAt: now,
    updatedBy: userId,
  };

  if (!existingDoc.exists) {
    contentData.createdAt = now;
    contentData.createdBy = userId;
  }

  await docRef.set(contentData, { merge: true });

  // Log the change
  await logSettingsChange("landing_full", "landing_content", data, userId);

  return getLandingContent();
};

/**
 * Reset landing content to defaults
 */
export const resetLandingContent = async (section = null, userId = "system") => {
  const docRef = landingContentCollection.doc("main");

  if (section) {
    // Reset specific section
    await docRef.update({
      [section]: defaultLandingContent[section],
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
    });
  } else {
    // Reset all
    await docRef.set({
      ...defaultLandingContent,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: userId,
    });
  }

  await logSettingsChange(`landing_reset_${section || "all"}`, "landing_content", { reset: true }, userId);

  return getLandingContent();
};

// Export default content for initialization
export { defaultLandingContent };

// ==================== AUDIT LOGGING ====================

/**
 * Log settings change for audit trail
 */
const logSettingsChange = async (section, type, data, userId) => {
  try {
    await db.collection("auditLogs").add({
      type: "settings_change",
      section,
      settingsType: type,
      changes: data,
      userId,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log settings change:", error);
    // Don't throw - logging failure shouldn't prevent settings update
  }
};
