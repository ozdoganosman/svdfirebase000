/**
 * Email templates for notifications
 * These templates are designed to work with Firebase Trigger Email Extension
 *
 * Templates can be customized via Admin Panel > Settings > Email
 * Custom templates are stored in Firestore and override defaults
 */

import { getEmailTemplate } from "../db/settings.js";

// Helper function to format currency
const formatCurrency = (amount, currency = "TRY") => {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount);
};

// Helper function to format date
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("tr-TR");
};

/**
 * Process template by replacing variables
 * Supports: {{variable}}, {{#if condition}}...{{/if}}, {{#each items}}...{{/each}}
 */
const processTemplate = (template, data) => {
  if (!template) return "";

  let result = template;

  // Process {{#each items}}...{{/each}} blocks
  result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
    const array = getNestedValue(data, arrayName);
    if (!Array.isArray(array)) return "";

    return array.map(item => {
      let itemContent = content;
      // Replace item variables like {{this.title}}, {{this.quantity}}
      itemContent = itemContent.replace(/\{\{this\.(\w+)\}\}/g, (m, prop) => {
        const value = item[prop];
        return value !== undefined ? String(value) : "";
      });
      // Also support {{title}}, {{quantity}} directly within each block
      itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, (m, prop) => {
        if (prop === "formatCurrency") return m; // Skip helper functions
        const value = item[prop];
        return value !== undefined ? String(value) : m;
      });
      return itemContent;
    }).join("");
  });

  // Process {{#if condition}}...{{/if}} blocks
  result = result.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    const value = getNestedValue(data, condition);
    return value ? content : "";
  });

  // Process {{#if condition}}...{{else}}...{{/if}} blocks
  result = result.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, ifContent, elseContent) => {
    const value = getNestedValue(data, condition);
    return value ? ifContent : elseContent;
  });

  // Process simple {{variable}} replacements
  result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? String(value) : "";
  });

  return result;
};

// Helper to get nested values like "customer.name" from data object
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

/**
 * Build template data object with common computed values
 */
const buildTemplateData = (type, entity) => {
  const baseUrl = "https://svdfirebase000.web.app";

  const common = {
    siteName: "SVD Ambalaj",
    siteUrl: baseUrl,
    currentYear: new Date().getFullYear(),
  };

  if (type === "quote") {
    return {
      ...common,
      ...entity,
      quoteNumber: entity.quoteNumber || "",
      createdAtFormatted: formatDate(entity.createdAt),
      validUntilFormatted: entity.validUntil ? formatDate(entity.validUntil) : "",
      totalFormatted: formatCurrency(entity.totals?.total || 0),
      customerName: entity.customer?.name || "",
      customerCompany: entity.customer?.company || "",
      customerEmail: entity.customer?.email || "",
      customerPhone: entity.customer?.phone || "",
      hasAdminNotes: !!entity.adminNotes,
      hasValidUntil: !!entity.validUntil,
      itemsFormatted: (entity.items || []).map(item => ({
        ...item,
        subtotalFormatted: formatCurrency(item.subtotal || 0),
      })),
      quotesUrl: `${baseUrl}/account/quotes`,
      adminQuotesUrl: `${baseUrl}/admin/quotes`,
    };
  }

  if (type === "sample") {
    return {
      ...common,
      ...entity,
      sampleNumber: entity.sampleNumber || "",
      createdAtFormatted: formatDate(entity.createdAt),
      shippingFeeFormatted: formatCurrency(entity.shippingFee || 200),
      customerName: entity.customer?.name || "",
      customerCompany: entity.customer?.company || "",
      customerEmail: entity.customer?.email || "",
      customerPhone: entity.customer?.phone || "",
      hasNotes: !!entity.notes,
      samplesUrl: `${baseUrl}/account/samples`,
      adminSamplesUrl: `${baseUrl}/admin/samples`,
    };
  }

  return { ...common, ...entity };
};

// ============================================================================
// DEFAULT TEMPLATES (used when no custom template exists in DB)
// ============================================================================

const defaultQuoteApprovedHtml = `
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
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f3f4f6; font-weight: bold; }
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
        <p><strong>Tarih:</strong> {{createdAtFormatted}}</p>
        {{#if hasValidUntil}}<p><strong>Geçerlilik:</strong> {{validUntilFormatted}} tarihine kadar</p>{{/if}}
      </div>

      <p>Sayın {{customerName}},</p>
      <p>Teklif talebiniz incelenmiş ve onaylanmıştır. Teklif detaylarını ekteki PDF dosyasında bulabilirsiniz.</p>

      <h3>Ürün Özeti:</h3>
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Miktar</th>
            <th>Toplam</th>
          </tr>
        </thead>
        <tbody>
          {{#each itemsFormatted}}
          <tr>
            <td>{{this.title}}</td>
            <td>{{this.quantity}} adet</td>
            <td>{{this.subtotalFormatted}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <p style="font-size: 18px; font-weight: bold; text-align: right;">
        Toplam: {{totalFormatted}}
      </p>

      {{#if hasAdminNotes}}
      <div class="info-box">
        <p><strong>Not:</strong></p>
        <p>{{adminNotes}}</p>
      </div>
      {{/if}}

      <p>Sipariş vermek için lütfen web sitemizi ziyaret edin.</p>

      <a href="{{quotesUrl}}" class="button">Tekliflerimi Görüntüle</a>

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Bu teklif {{#if hasValidUntil}}{{validUntilFormatted}} tarihine{{else}}30 gün{{/if}} kadar geçerlidir.
      </p>
    </div>

    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
`;

const defaultQuoteApprovedText = `
Sayın {{customerName}},

Teklifiniz onaylanmıştır!

Teklif No: {{quoteNumber}}
Tarih: {{createdAtFormatted}}
{{#if hasValidUntil}}Geçerlilik: {{validUntilFormatted}} tarihine kadar{{/if}}

Toplam: {{totalFormatted}}

Teklif detaylarını ekteki PDF dosyasında bulabilirsiniz.

{{#if hasAdminNotes}}Not: {{adminNotes}}{{/if}}

Sipariş vermek için: {{quotesUrl}}

{{siteName}}
`;

const defaultQuoteRejectedHtml = `
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
        <p><strong>Tarih:</strong> {{createdAtFormatted}}</p>
      </div>

      <p>Sayın {{customerName}},</p>
      <p>Teklif talebiniz incelenmiştir. Üzgünüz, mevcut durumda bu teklifi karşılayamıyoruz.</p>

      {{#if hasAdminNotes}}
      <div class="info-box">
        <p><strong>Açıklama:</strong></p>
        <p>{{adminNotes}}</p>
      </div>
      {{/if}}

      <p>Farklı ürünler veya miktarlar için yeni bir teklif talebi oluşturabilirsiniz.</p>
      <p>Sorularınız için bizimle iletişime geçmekten çekinmeyin.</p>
    </div>

    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
`;

const defaultQuoteRejectedText = `
Sayın {{customerName}},

Teklif talebiniz hakkında:

Teklif No: {{quoteNumber}}
Tarih: {{createdAtFormatted}}

{{#if hasAdminNotes}}Açıklama: {{adminNotes}}{{/if}}

Üzgünüz, mevcut durumda bu teklifi karşılayamıyoruz.

Farklı ürünler için yeni teklif talebi oluşturabilirsiniz.

{{siteName}}
`;

const defaultSampleApprovedHtml = `
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
    ul { padding-left: 20px; }
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
        <p><strong>Tarih:</strong> {{createdAtFormatted}}</p>
        <p><strong>Kargo Ücreti:</strong> {{shippingFeeFormatted}} (KDV Dahil)</p>
      </div>

      <p>Sayın {{customerName}},</p>
      <p>Numune talebiniz onaylanmıştır. Ürünleriniz hazırlanıyor ve en kısa sürede kargoya verilecektir.</p>

      <h3>Talep Edilen Ürünler:</h3>
      <ul>
        {{#each items}}<li>{{this.title}} - {{this.quantity}} adet</li>{{/each}}
      </ul>

      <p>Kargo takip numarası oluşturulduğunda size bildirilecektir.</p>
    </div>

    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
`;

const defaultSampleApprovedText = `
Sayın {{customerName}},

Numune talebiniz onaylanmıştır!

Numune No: {{sampleNumber}}
Tarih: {{createdAtFormatted}}
Kargo Ücreti: {{shippingFeeFormatted}} (KDV Dahil)

Talep Edilen Ürünler:
{{#each items}}- {{this.title}} - {{this.quantity}} adet
{{/each}}

Kargo takip numarası oluşturulduğunda size bildirilecektir.

{{siteName}}
`;

const defaultNewQuoteAdminHtml = `
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
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
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

      <h3>Ürünler:</h3>
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Miktar</th>
            <th>Toplam</th>
          </tr>
        </thead>
        <tbody>
          {{#each itemsFormatted}}
          <tr>
            <td>{{this.title}}</td>
            <td>{{this.quantity}}</td>
            <td>{{this.subtotalFormatted}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <p style="font-size: 18px; font-weight: bold;">
        Toplam: {{totalFormatted}}
      </p>

      <a href="{{adminQuotesUrl}}" class="button">Admin Panelinde Görüntüle</a>
    </div>
  </div>
</body>
</html>
`;

const defaultNewQuoteAdminText = `
Yeni Teklif Talebi

Teklif No: {{quoteNumber}}
Müşteri: {{customerName}} {{#if customerCompany}}({{customerCompany}}){{/if}}
E-posta: {{customerEmail}}
Telefon: {{customerPhone}}

Toplam: {{totalFormatted}}

Admin panelinde görüntüle: {{adminQuotesUrl}}
`;

const defaultNewSampleAdminHtml = `
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
    ul { padding-left: 20px; }
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

      <h3>Talep Edilen Ürünler:</h3>
      <ul>
        {{#each items}}<li>{{this.title}} - {{this.quantity}} adet</li>{{/each}}
      </ul>

      <p><strong>Kargo Ücreti:</strong> {{shippingFeeFormatted}} (KDV Dahil)</p>

      {{#if hasNotes}}<p><strong>Müşteri Notu:</strong> {{notes}}</p>{{/if}}

      <a href="{{adminSamplesUrl}}" class="button">Admin Panelinde Görüntüle</a>
    </div>
  </div>
</body>
</html>
`;

const defaultNewSampleAdminText = `
Yeni Numune Talebi

Numune No: {{sampleNumber}}
Müşteri: {{customerName}} {{#if customerCompany}}({{customerCompany}}){{/if}}
E-posta: {{customerEmail}}
Telefon: {{customerPhone}}

Talep Edilen Ürünler:
{{#each items}}- {{this.title}} - {{this.quantity}} adet
{{/each}}

Kargo Ücreti: {{shippingFeeFormatted}} (KDV Dahil)

{{#if hasNotes}}Müşteri Notu: {{notes}}{{/if}}

Admin panelinde görüntüle: {{adminSamplesUrl}}
`;

// Stock Alert Templates
const defaultStockAlertHtml = `
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
    .out-of-stock { color: #dc2626; font-weight: bold; background-color: #fef2f2; }
    .summary-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
    .summary-box.warning { background-color: #fffbeb; border-left-color: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header {{alertClass}}">
      <h1>{{alertEmoji}} Stok Uyarısı</h1>
      <p>{{alertTitle}}</p>
    </div>

    <div class="content">
      <div class="summary-box {{alertClass}}">
        <h3>Özet</h3>
        <p><strong>Stokta Yok:</strong> {{outOfStockCount}} ürün</p>
        <p><strong>Kritik Seviye:</strong> {{criticalCount}} ürün</p>
        <p><strong>Düşük Seviye:</strong> {{lowCount}} ürün</p>
        <p><strong>Toplam Uyarı:</strong> {{totalAlerts}} ürün</p>
      </div>

      {{#if hasOutOfStock}}
      <h3 class="out-of-stock">🚫 Stokta Olmayan Ürünler</h3>
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Stok</th>
          </tr>
        </thead>
        <tbody>
          {{#each outOfStock}}
          <tr class="out-of-stock">
            <td>{{this.title}}</td>
            <td>0</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      {{/if}}

      {{#if hasCritical}}
      <h3 class="critical">🚨 Kritik Stok Seviyesi</h3>
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Stok</th>
          </tr>
        </thead>
        <tbody>
          {{#each critical}}
          <tr>
            <td>{{this.title}}</td>
            <td class="critical">{{this.stock}} adet</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      {{/if}}

      {{#if hasLow}}
      <h3 class="low">⚠️ Düşük Stok Seviyesi</h3>
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Stok</th>
          </tr>
        </thead>
        <tbody>
          {{#each low}}
          <tr>
            <td>{{this.title}}</td>
            <td class="low">{{this.stock}} adet</td>
          </tr>
          {{/each}}
        </tbody>
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
`;

const defaultStockAlertText = `
STOK UYARISI - {{alertTitle}}

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

{{siteName}}
`;

// Order Confirmation Template
const defaultOrderConfirmationHtml = `
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
    .total-row { font-weight: bold; font-size: 16px; }
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
          <tr>
            <th>Ürün</th>
            <th>Miktar</th>
            <th>Fiyat</th>
          </tr>
        </thead>
        <tbody>
          {{#each itemsFormatted}}
          <tr>
            <td>{{this.title}}</td>
            <td>{{this.quantity}} adet</td>
            <td>{{this.subtotalFormatted}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <table>
        <tr>
          <td>Ara Toplam</td>
          <td style="text-align: right;">{{subtotalFormatted}}</td>
        </tr>
        {{#if hasDiscount}}
        <tr style="color: #10b981;">
          <td>İndirim</td>
          <td style="text-align: right;">-{{discountFormatted}}</td>
        </tr>
        {{/if}}
        <tr>
          <td>KDV</td>
          <td style="text-align: right;">{{taxFormatted}}</td>
        </tr>
        <tr class="total-row">
          <td>Genel Toplam</td>
          <td style="text-align: right;">{{totalFormatted}}</td>
        </tr>
      </table>

      {{#if isBankTransfer}}
      <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #92400e; margin: 0 0 15px 0;">🏦 Banka Hesap Bilgileri</h3>
        {{#each bankAccounts}}
        <div style="background: white; border-radius: 6px; padding: 12px; margin-bottom: 10px; border: 1px solid #fde68a;">
          <p style="margin: 0; font-weight: bold; color: #374151;">{{this.bank}}</p>
          <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 14px; color: #1f2937;">{{this.iban}}</p>
        </div>
        {{/each}}
        <p style="color: #92400e; font-size: 12px; margin: 15px 0 0 0;">
          ⚠️ Açıklama kısmına sipariş numaranızı (<strong>{{orderNumber}}</strong>) yazınız.
        </p>
        <p style="color: #1e40af; font-size: 12px; margin: 10px 0 0 0;">
          📤 Ödemenizi yaptıktan sonra <a href="{{ordersUrl}}" style="color: #1e40af;">siparişlerim</a> sayfasından dekontunuzu yükleyebilirsiniz.
        </p>
      </div>
      {{/if}}

      <div class="info-box">
        <p><strong>Teslimat Adresi:</strong></p>
        <p>{{deliveryAddress}}</p>
        <p>{{deliveryCity}}</p>
      </div>

      {{#if hasNotes}}
      <div class="info-box">
        <p><strong>Notunuz:</strong></p>
        <p>{{notes}}</p>
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
`;

const defaultOrderConfirmationText = `
Sayın {{customerName}},

Siparişinizi aldık!

Sipariş No: {{orderNumber}}
Tarih: {{createdAtFormatted}}
Durum: {{statusText}}

Toplam: {{totalFormatted}}

{{#if isBankTransfer}}
BANKA HESAP BİLGİLERİ:
{{#each bankAccounts}}
{{this.bank}}
IBAN: {{this.iban}}
{{/each}}

Açıklama kısmına sipariş numaranızı ({{orderNumber}}) yazınız.
Ödemenizi yaptıktan sonra siparişlerim sayfasından dekontunuzu yükleyebilirsiniz.
{{/if}}

Teslimat Adresi:
{{deliveryAddress}}
{{deliveryCity}}

Siparişlerinizi görüntülemek için: {{ordersUrl}}

{{siteName}}
`;

// Order Status Update Template
const defaultOrderStatusHtml = `
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
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    .status-confirmed { background-color: #dbeafe; color: #1e40af; }
    .status-shipped { background-color: #e9d5ff; color: #7c3aed; }
    .status-delivered { background-color: #d1fae5; color: #065f46; }
    .status-cancelled { background-color: #fee2e2; color: #991b1b; }
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
        <p><strong>Yeni Durum:</strong> <span class="status-badge status-{{status}}">{{statusText}}</span></p>
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
`;

const defaultOrderStatusText = `
Sayın {{customerName}},

Siparişinizin durumu güncellendi!

Sipariş No: {{orderNumber}}
Yeni Durum: {{statusText}}
Güncelleme Tarihi: {{updatedAtFormatted}}

{{statusMessage}}

{{#if hasTrackingNumber}}Kargo Takip No: {{trackingNumber}}{{/if}}

{{#if hasAdminNotes}}Not: {{adminNotes}}{{/if}}

Siparişinizi görüntülemek için: {{ordersUrl}}

{{siteName}}
`;

// Welcome Email Template
const defaultWelcomeHtml = `
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
    .feature-icon { font-size: 32px; margin-bottom: 10px; }
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

      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        <div class="feature-box" style="flex: 1; min-width: 150px;">
          <div class="feature-icon">🛒</div>
          <p><strong>Online Sipariş</strong></p>
          <p style="font-size: 12px;">7/24 sipariş verin</p>
        </div>
        <div class="feature-box" style="flex: 1; min-width: 150px;">
          <div class="feature-icon">📋</div>
          <p><strong>Teklif Talebi</strong></p>
          <p style="font-size: 12px;">Özel fiyat alın</p>
        </div>
        <div class="feature-box" style="flex: 1; min-width: 150px;">
          <div class="feature-icon">📦</div>
          <p><strong>Numune Talebi</strong></p>
          <p style="font-size: 12px;">Ürünleri deneyin</p>
        </div>
      </div>

      <p style="text-align: center; margin-top: 20px;">
        <a href="{{siteUrl}}/products" class="button">Ürünleri Keşfet</a>
        <a href="{{siteUrl}}/account" class="button" style="background-color: #6b7280;">Hesabım</a>
      </p>

      <p style="margin-top: 20px;">Sorularınız için bize ulaşmaktan çekinmeyin.</p>
    </div>

    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta, hesap oluşturduğunuz için gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
`;

const defaultWelcomeText = `
Merhaba {{userName}},

{{siteName}} ailesine hoş geldiniz!

Hesabınız başarıyla oluşturuldu. Artık tüm hizmetlerimizden yararlanabilirsiniz:

- Online Sipariş: 7/24 sipariş verin
- Teklif Talebi: Özel fiyatlar alın
- Numune Talebi: Ürünleri deneyin

Ürünleri keşfetmek için: {{siteUrl}}/products
Hesabınız: {{siteUrl}}/account

Sorularınız için bize ulaşmaktan çekinmeyin.

{{siteName}}
`;

// Default templates map
const defaultTemplates = {
  quoteApproved: {
    subject: "Teklifiniz Onaylandı - {{quoteNumber}}",
    htmlTemplate: defaultQuoteApprovedHtml,
    textTemplate: defaultQuoteApprovedText,
  },
  quoteRejected: {
    subject: "Teklif Talebiniz Hakkında - {{quoteNumber}}",
    htmlTemplate: defaultQuoteRejectedHtml,
    textTemplate: defaultQuoteRejectedText,
  },
  sampleApproved: {
    subject: "Numune Talebiniz Onaylandı - {{sampleNumber}}",
    htmlTemplate: defaultSampleApprovedHtml,
    textTemplate: defaultSampleApprovedText,
  },
  newQuoteAdmin: {
    subject: "Yeni Teklif Talebi - {{quoteNumber}}",
    htmlTemplate: defaultNewQuoteAdminHtml,
    textTemplate: defaultNewQuoteAdminText,
  },
  newSampleAdmin: {
    subject: "Yeni Numune Talebi - {{sampleNumber}}",
    htmlTemplate: defaultNewSampleAdminHtml,
    textTemplate: defaultNewSampleAdminText,
  },
  stockAlert: {
    subject: "🚨 Stok Uyarısı - {{totalAlerts}} ürün dikkat gerektiriyor",
    htmlTemplate: defaultStockAlertHtml,
    textTemplate: defaultStockAlertText,
  },
  orderConfirmation: {
    subject: "✅ Siparişiniz Alındı - #{{orderNumber}}",
    htmlTemplate: defaultOrderConfirmationHtml,
    textTemplate: defaultOrderConfirmationText,
  },
  orderStatus: {
    subject: "📦 Sipariş Durumu Güncellendi - #{{orderNumber}}",
    htmlTemplate: defaultOrderStatusHtml,
    textTemplate: defaultOrderStatusText,
  },
  welcome: {
    subject: "🎉 {{siteName}} Ailesine Hoş Geldiniz!",
    htmlTemplate: defaultWelcomeHtml,
    textTemplate: defaultWelcomeText,
  },
};

// ============================================================================
// TEMPLATE FUNCTIONS (Async - reads from DB with fallback to defaults)
// ============================================================================

/**
 * Quote Approved Email Template
 */
export async function quoteApprovedTemplate(quote) {
  const templateData = buildTemplateData("quote", quote);

  // Try to get custom template from DB
  const customTemplate = await getEmailTemplate("quoteApproved");
  const template = customTemplate || defaultTemplates.quoteApproved;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * Quote Rejected Email Template
 */
export async function quoteRejectedTemplate(quote) {
  const templateData = buildTemplateData("quote", quote);

  const customTemplate = await getEmailTemplate("quoteRejected");
  const template = customTemplate || defaultTemplates.quoteRejected;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * Sample Approved Email Template
 */
export async function sampleApprovedTemplate(sample) {
  const templateData = buildTemplateData("sample", sample);

  const customTemplate = await getEmailTemplate("sampleApproved");
  const template = customTemplate || defaultTemplates.sampleApproved;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * New Quote Notification for Admin
 */
export async function newQuoteAdminTemplate(quote) {
  const templateData = buildTemplateData("quote", quote);

  const customTemplate = await getEmailTemplate("newQuoteAdmin");
  const template = customTemplate || defaultTemplates.newQuoteAdmin;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * New Sample Request Notification for Admin
 */
export async function newSampleAdminTemplate(sample) {
  const templateData = buildTemplateData("sample", sample);

  const customTemplate = await getEmailTemplate("newSampleAdmin");
  const template = customTemplate || defaultTemplates.newSampleAdmin;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * Stock Alert Email Template
 */
export async function stockAlertTemplate(stockData) {
  const baseUrl = "https://svdfirebase000.web.app";

  const templateData = {
    siteName: "SVD Ambalaj",
    siteUrl: baseUrl,
    adminProductsUrl: `${baseUrl}/admin/products`,
    // Summary
    outOfStockCount: stockData.summary?.outOfStockCount || 0,
    criticalCount: stockData.summary?.criticalCount || 0,
    lowCount: stockData.summary?.lowCount || 0,
    totalAlerts: stockData.summary?.totalAlerts || 0,
    // Product lists
    outOfStock: stockData.outOfStock || [],
    critical: stockData.critical || [],
    low: stockData.low || [],
    // Conditional flags
    hasOutOfStock: (stockData.outOfStock || []).length > 0,
    hasCritical: (stockData.critical || []).length > 0,
    hasLow: (stockData.low || []).length > 0,
    // Alert styling
    alertEmoji: (stockData.outOfStock || []).length > 0 ? "🚫" : "⚠️",
    alertTitle: (stockData.outOfStock || []).length > 0
      ? "Stokta Olmayan Ürünler Var!"
      : "Düşük Stok Uyarısı",
    alertClass: (stockData.outOfStock || []).length > 0 ? "" : "warning",
  };

  const customTemplate = await getEmailTemplate("stockAlert");
  const template = customTemplate || defaultTemplates.stockAlert;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * Order Confirmation Email Template
 */
export async function orderConfirmationTemplate(order) {
  const baseUrl = "https://svdfirebase000.web.app";

  // Status text mapping
  const statusTextMap = {
    pending: "Beklemede",
    confirmed: "Onaylandı",
    processing: "Hazırlanıyor",
    shipped: "Kargoya Verildi",
    delivered: "Teslim Edildi",
    cancelled: "İptal Edildi",
  };

  // Bank account information for bank transfer orders
  const bankAccounts = [
    { bank: "GARANTİ BANKASI - ELEKTROKENT ŞB.", iban: "TR64 0006 2001 4950 0006 2969 00" },
    { bank: "HALKBANK - D.EVLER ŞB.", iban: "TR29 0001 2009 3920 0010 2608 07" },
  ];

  const templateData = {
    siteName: "SVD Ambalaj",
    siteUrl: baseUrl,
    ordersUrl: `${baseUrl}/account/orders`,
    orderNumber: order.orderNumber || order.id,
    createdAtFormatted: formatDate(order.createdAt),
    statusText: statusTextMap[order.status] || order.status,
    customerName: order.customer?.name || order.billingAddress?.name || "",
    customerEmail: order.customer?.email || "",
    // Totals
    subtotalFormatted: formatCurrency(order.totals?.subtotal || 0),
    discountFormatted: formatCurrency(order.totals?.discount || 0),
    taxFormatted: formatCurrency(order.totals?.tax || 0),
    totalFormatted: formatCurrency(order.totals?.total || 0),
    hasDiscount: (order.totals?.discount || 0) > 0,
    // Items
    itemsFormatted: (order.items || []).map(item => ({
      ...item,
      subtotalFormatted: formatCurrency(item.subtotal || item.price * item.quantity || 0),
    })),
    // Delivery address
    deliveryAddress: order.shippingAddress?.address || order.deliveryAddress?.address || "",
    deliveryCity: order.shippingAddress?.city || order.deliveryAddress?.city || "",
    // Notes
    notes: order.notes || "",
    hasNotes: !!order.notes,
    // Bank transfer info
    paymentMethod: order.paymentMethod || "bank_transfer",
    isBankTransfer: order.paymentMethod !== "credit_card",
    bankAccounts: bankAccounts,
  };

  const customTemplate = await getEmailTemplate("orderConfirmation");
  const template = customTemplate || defaultTemplates.orderConfirmation;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * Order Status Update Email Template
 */
export async function orderStatusTemplate(order) {
  const baseUrl = "https://svdfirebase000.web.app";

  // Status text and message mapping
  const statusConfig = {
    pending: {
      text: "Beklemede",
      message: "Siparişiniz alındı ve inceleme aşamasında.",
      emoji: "⏳",
      class: "pending",
    },
    confirmed: {
      text: "Onaylandı",
      message: "Siparişiniz onaylandı ve hazırlanmak üzere kuyruğa alındı.",
      emoji: "✅",
      class: "confirmed",
    },
    processing: {
      text: "Hazırlanıyor",
      message: "Siparişiniz hazırlanıyor.",
      emoji: "📦",
      class: "confirmed",
    },
    shipped: {
      text: "Kargoya Verildi",
      message: "Siparişiniz kargoya verildi! Kargo takip numaranız ile gönderinizi takip edebilirsiniz.",
      emoji: "🚚",
      class: "shipped",
    },
    delivered: {
      text: "Teslim Edildi",
      message: "Siparişiniz başarıyla teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz!",
      emoji: "🎉",
      class: "delivered",
    },
    cancelled: {
      text: "İptal Edildi",
      message: "Siparişiniz iptal edildi.",
      emoji: "❌",
      class: "cancelled",
    },
  };

  const statusInfo = statusConfig[order.status] || statusConfig.pending;

  const templateData = {
    siteName: "SVD Ambalaj",
    siteUrl: baseUrl,
    ordersUrl: `${baseUrl}/account/orders`,
    orderNumber: order.orderNumber || order.id,
    status: order.status,
    statusText: statusInfo.text,
    statusEmoji: statusInfo.emoji,
    statusClass: statusInfo.class,
    statusMessage: statusInfo.message,
    updatedAtFormatted: formatDate(order.updatedAt || new Date().toISOString()),
    customerName: order.customer?.name || order.billingAddress?.name || "",
    // Tracking info
    trackingNumber: order.trackingNumber || "",
    trackingUrl: order.trackingUrl || "",
    hasTrackingNumber: !!order.trackingNumber,
    // Admin notes
    adminNotes: order.adminNotes || "",
    hasAdminNotes: !!order.adminNotes,
  };

  const customTemplate = await getEmailTemplate("orderStatus");
  const template = customTemplate || defaultTemplates.orderStatus;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * Welcome Email Template (New User Registration)
 */
export async function welcomeTemplate(user) {
  const baseUrl = "https://svdfirebase000.web.app";

  const templateData = {
    siteName: "SVD Ambalaj",
    siteUrl: baseUrl,
    userName: user.displayName || user.name || user.email?.split("@")[0] || "Değerli Müşterimiz",
    userEmail: user.email || "",
    currentYear: new Date().getFullYear(),
  };

  const customTemplate = await getEmailTemplate("welcome");
  const template = customTemplate || defaultTemplates.welcome;

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

// ============================================================================
// SHIPPING NOTIFICATION TEMPLATES
// ============================================================================

const defaultShippingNotificationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background-color: white; border-left: 4px solid #8b5cf6; padding: 15px; margin: 15px 0; }
    .tracking-box { background-color: #ede9fe; border: 2px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .tracking-number { font-size: 24px; font-weight: bold; color: #7c3aed; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{siteName}}</h1>
      <p>🚚 Siparişiniz Kargoya Verildi!</p>
    </div>

    <div class="content">
      <p>Sayın {{customerName}},</p>
      <p>Harika haberlerimiz var! <strong>#{{orderNumber}}</strong> numaralı siparişiniz kargoya verildi ve yola çıktı.</p>

      <div class="tracking-box">
        <p style="margin: 0 0 10px 0; color: #6b7280;">Kargo Takip Numaranız:</p>
        <p class="tracking-number">{{trackingNumber}}</p>
        {{#if carrier}}<p style="margin: 10px 0 0 0; color: #6b7280;">Kargo Firması: <strong>{{carrier}}</strong></p>{{/if}}
      </div>

      {{#if trackingUrl}}
      <p style="text-align: center;">
        <a href="{{trackingUrl}}" class="button">Kargonuzu Takip Edin</a>
      </p>
      {{/if}}

      <div class="info-box">
        <p><strong>Sipariş No:</strong> {{orderNumber}}</p>
        <p><strong>Kargo Tarihi:</strong> {{shippedAtFormatted}}</p>
        {{#if estimatedDelivery}}<p><strong>Tahmini Teslimat:</strong> {{estimatedDelivery}}</p>{{/if}}
      </div>

      <h3>Teslimat Adresi:</h3>
      <div class="info-box">
        <p>{{deliveryAddress}}</p>
        <p>{{deliveryCity}}</p>
      </div>

      <p>Kargonuz genellikle 2-4 iş günü içinde teslim edilir. Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>

      <a href="{{ordersUrl}}" class="button">Siparişimi Görüntüle</a>
    </div>

    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
`;

const defaultShippingNotificationText = `
Sayın {{customerName}},

Siparişiniz kargoya verildi!

Sipariş No: {{orderNumber}}
Kargo Takip No: {{trackingNumber}}
{{#if carrier}}Kargo Firması: {{carrier}}{{/if}}
Kargo Tarihi: {{shippedAtFormatted}}
{{#if estimatedDelivery}}Tahmini Teslimat: {{estimatedDelivery}}{{/if}}

Teslimat Adresi:
{{deliveryAddress}}
{{deliveryCity}}

{{#if trackingUrl}}Kargonuzu takip edin: {{trackingUrl}}{{/if}}

Siparişinizi görüntülemek için: {{ordersUrl}}

{{siteName}}
`;

const defaultSampleShippingNotificationHtml = `
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
    .tracking-box { background-color: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .tracking-number { font-size: 24px; font-weight: bold; color: #059669; letter-spacing: 2px; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{siteName}}</h1>
      <p>📦 Numuneleriniz Kargoya Verildi!</p>
    </div>

    <div class="content">
      <p>Sayın {{customerName}},</p>
      <p>Numune talebiniz hazırlandı ve kargoya verildi!</p>

      <div class="tracking-box">
        <p style="margin: 0 0 10px 0; color: #6b7280;">Kargo Takip Numaranız:</p>
        <p class="tracking-number">{{trackingNumber}}</p>
        {{#if carrier}}<p style="margin: 10px 0 0 0; color: #6b7280;">Kargo Firması: <strong>{{carrier}}</strong></p>{{/if}}
      </div>

      <div class="info-box">
        <p><strong>Numune No:</strong> {{sampleNumber}}</p>
        <p><strong>Kargo Tarihi:</strong> {{shippedAtFormatted}}</p>
      </div>

      <h3>Gönderilen Numuneler:</h3>
      <ul>
        {{#each items}}<li>{{this.title}} - {{this.quantity}} adet</li>{{/each}}
      </ul>

      <h3>Teslimat Adresi:</h3>
      <div class="info-box">
        <p>{{deliveryAddress}}</p>
        <p>{{deliveryCity}}</p>
      </div>

      <p>Numuneleriniz genellikle 2-4 iş günü içinde elinize ulaşır. Ürünlerimizi beğeneceğinizi umuyoruz!</p>
    </div>

    <div class="footer">
      <p>{{siteName}} - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
`;

const defaultSampleShippingNotificationText = `
Sayın {{customerName}},

Numuneleriniz kargoya verildi!

Numune No: {{sampleNumber}}
Kargo Takip No: {{trackingNumber}}
{{#if carrier}}Kargo Firması: {{carrier}}{{/if}}
Kargo Tarihi: {{shippedAtFormatted}}

Gönderilen Numuneler:
{{#each items}}- {{this.title}} - {{this.quantity}} adet
{{/each}}

Teslimat Adresi:
{{deliveryAddress}}
{{deliveryCity}}

{{siteName}}
`;

/**
 * Shipping Notification Email Template (Order)
 */
export async function shippingNotificationTemplate(order) {
  const baseUrl = "https://svdfirebase000.web.app";

  // Carrier tracking URL mapping
  const carrierTrackingUrls = {
    "Yurtiçi Kargo": "https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=",
    "Aras Kargo": "https://www.araskargo.com.tr/trs_gonderi_takip.aspx?gession=",
    "MNG Kargo": "https://www.mngkargo.com.tr/gonderi-takip/?gon=",
    "PTT Kargo": "https://gonderitakip.ptt.gov.tr/Track/Verify?q=",
    "Sürat Kargo": "https://www.suratkargo.com.tr/gonderi-takip?takipNo=",
    "UPS": "https://www.ups.com/track?tracknum=",
    "FedEx": "https://www.fedex.com/fedextrack/?trknbr=",
    "DHL": "https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=",
  };

  const carrier = order.carrier || order.shippingCarrier || "";
  const trackingNumber = order.trackingNumber || "";
  let trackingUrl = order.trackingUrl || "";

  // Auto-generate tracking URL if not provided
  if (!trackingUrl && trackingNumber && carrier) {
    const baseTrackingUrl = carrierTrackingUrls[carrier];
    if (baseTrackingUrl) {
      trackingUrl = baseTrackingUrl + trackingNumber;
    }
  }

  const templateData = {
    siteName: "SVD Ambalaj",
    siteUrl: baseUrl,
    ordersUrl: `${baseUrl}/account/orders`,
    orderNumber: order.orderNumber || order.id,
    customerName: order.customer?.name || order.billingAddress?.name || "",
    trackingNumber,
    carrier,
    trackingUrl,
    shippedAtFormatted: formatDate(order.shippedAt || order.updatedAt || new Date().toISOString()),
    estimatedDelivery: order.estimatedDelivery || "",
    deliveryAddress: order.shippingAddress?.address || order.deliveryAddress?.address || "",
    deliveryCity: order.shippingAddress?.city || order.deliveryAddress?.city || "",
  };

  // Use orderStatus template as fallback or create dedicated template
  const customTemplate = await getEmailTemplate("shippingNotification");
  const template = customTemplate || {
    subject: "🚚 Siparişiniz Kargoya Verildi - #{{orderNumber}}",
    htmlTemplate: defaultShippingNotificationHtml,
    textTemplate: defaultShippingNotificationText,
  };

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

/**
 * Sample Shipping Notification Email Template
 */
export async function sampleShippingNotificationTemplate(sample) {
  const baseUrl = "https://svdfirebase000.web.app";

  const carrierTrackingUrls = {
    "Yurtiçi Kargo": "https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=",
    "Aras Kargo": "https://www.araskargo.com.tr/trs_gonderi_takip.aspx?gession=",
    "MNG Kargo": "https://www.mngkargo.com.tr/gonderi-takip/?gon=",
    "PTT Kargo": "https://gonderitakip.ptt.gov.tr/Track/Verify?q=",
    "Sürat Kargo": "https://www.suratkargo.com.tr/gonderi-takip?takipNo=",
    "UPS": "https://www.ups.com/track?tracknum=",
    "FedEx": "https://www.fedex.com/fedextrack/?trknbr=",
    "DHL": "https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=",
  };

  const carrier = sample.carrier || "";
  const trackingNumber = sample.trackingNumber || "";
  let trackingUrl = "";

  if (trackingNumber && carrier) {
    const baseTrackingUrl = carrierTrackingUrls[carrier];
    if (baseTrackingUrl) {
      trackingUrl = baseTrackingUrl + trackingNumber;
    }
  }

  const templateData = {
    siteName: "SVD Ambalaj",
    siteUrl: baseUrl,
    sampleNumber: sample.sampleNumber || sample.id,
    customerName: sample.customer?.name || "",
    trackingNumber,
    carrier,
    trackingUrl,
    shippedAtFormatted: formatDate(sample.shippedAt || sample.updatedAt || new Date().toISOString()),
    items: sample.items || [],
    deliveryAddress: sample.address?.address || sample.customer?.address || "",
    deliveryCity: sample.address?.city || "",
  };

  const customTemplate = await getEmailTemplate("sampleShippingNotification");
  const template = customTemplate || {
    subject: "📦 Numuneleriniz Kargoya Verildi - #{{sampleNumber}}",
    htmlTemplate: defaultSampleShippingNotificationHtml,
    textTemplate: defaultSampleShippingNotificationText,
  };

  return {
    subject: processTemplate(template.subject, templateData),
    html: processTemplate(template.htmlTemplate, templateData),
    text: processTemplate(template.textTemplate, templateData),
  };
}

// Export default templates for reference (used by settings API)
export { defaultTemplates };
