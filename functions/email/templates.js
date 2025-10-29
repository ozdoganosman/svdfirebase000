/**
 * Email templates for notifications
 * These templates are designed to work with Firebase Trigger Email Extension
 */

/**
 * Quote Approved Email Template
 */
export function quoteApprovedTemplate(quote) {
  const subject = `Teklifiniz Onaylandı - ${quote.quoteNumber}`;

  const html = `
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
      <h1>SVD Ambalaj</h1>
      <p>Teklif Onay Bildirimi</p>
    </div>

    <div class="content">
      <h2>🎉 Teklifiniz Onaylandı!</h2>

      <div class="info-box">
        <p><strong>Teklif No:</strong> ${quote.quoteNumber}</p>
        <p><strong>Tarih:</strong> ${new Date(quote.createdAt).toLocaleDateString('tr-TR')}</p>
        ${quote.validUntil ? `<p><strong>Geçerlilik:</strong> ${new Date(quote.validUntil).toLocaleDateString('tr-TR')} tarihine kadar</p>` : ''}
      </div>

      <p>Sayın ${quote.customer.name},</p>
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
          ${quote.items.map(item => `
            <tr>
              <td>${item.title}</td>
              <td>${item.quantity} adet</td>
              <td>${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="font-size: 18px; font-weight: bold; text-align: right;">
        Toplam: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(quote.totals.total)}
      </p>

      ${quote.adminNotes ? `
        <div class="info-box">
          <p><strong>Not:</strong></p>
          <p>${quote.adminNotes}</p>
        </div>
      ` : ''}

      <p>Sipariş vermek için lütfen web sitemizi ziyaret edin.</p>

      <a href="https://svdfirebase000.web.app/account/quotes" class="button">Tekliflerimi Görüntüle</a>

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Bu teklif ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('tr-TR') + ' tarihine' : '30 gün'} kadar geçerlidir.
      </p>
    </div>

    <div class="footer">
      <p>SVD Ambalaj - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Sayın ${quote.customer.name},

Teklifiniz onaylanmıştır!

Teklif No: ${quote.quoteNumber}
Tarih: ${new Date(quote.createdAt).toLocaleDateString('tr-TR')}
${quote.validUntil ? `Geçerlilik: ${new Date(quote.validUntil).toLocaleDateString('tr-TR')} tarihine kadar` : ''}

Toplam: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(quote.totals.total)}

Teklif detaylarını ekteki PDF dosyasında bulabilirsiniz.

${quote.adminNotes ? `Not: ${quote.adminNotes}` : ''}

Sipariş vermek için: https://svdfirebase000.web.app/account/quotes

SVD Ambalaj
  `;

  return { subject, html, text };
}

/**
 * Quote Rejected Email Template
 */
export function quoteRejectedTemplate(quote) {
  const subject = `Teklif Talebiniz Hakkında - ${quote.quoteNumber}`;

  const html = `
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
      <h1>SVD Ambalaj</h1>
      <p>Teklif Bildirim</p>
    </div>

    <div class="content">
      <h2>Teklif Talebiniz Hakkında</h2>

      <div class="info-box">
        <p><strong>Teklif No:</strong> ${quote.quoteNumber}</p>
        <p><strong>Tarih:</strong> ${new Date(quote.createdAt).toLocaleDateString('tr-TR')}</p>
      </div>

      <p>Sayın ${quote.customer.name},</p>
      <p>Teklif talebiniz incelenmiştir. Üzgünüz, mevcut durumda bu teklifi karşılayamıyoruz.</p>

      ${quote.adminNotes ? `
        <div class="info-box">
          <p><strong>Açıklama:</strong></p>
          <p>${quote.adminNotes}</p>
        </div>
      ` : ''}

      <p>Farklı ürünler veya miktarlar için yeni bir teklif talebi oluşturabilirsiniz.</p>
      <p>Sorularınız için bizimle iletişime geçmekten çekinmeyin.</p>
    </div>

    <div class="footer">
      <p>SVD Ambalaj - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Sayın ${quote.customer.name},

Teklif talebiniz hakkında:

Teklif No: ${quote.quoteNumber}
Tarih: ${new Date(quote.createdAt).toLocaleDateString('tr-TR')}

${quote.adminNotes ? `Açıklama: ${quote.adminNotes}` : ''}

Üzgünüz, mevcut durumda bu teklifi karşılayamıyoruz.

Farklı ürünler için yeni teklif talebi oluşturabilirsiniz.

SVD Ambalaj
  `;

  return { subject, html, text };
}

/**
 * Sample Approved Email Template
 */
export function sampleApprovedTemplate(sample) {
  const subject = `Numune Talebiniz Onaylandı - ${sample.sampleNumber}`;

  const html = `
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
      <h1>SVD Ambalaj</h1>
      <p>Numune Onay Bildirimi</p>
    </div>

    <div class="content">
      <h2>🎉 Numune Talebiniz Onaylandı!</h2>

      <div class="info-box">
        <p><strong>Numune No:</strong> ${sample.sampleNumber}</p>
        <p><strong>Tarih:</strong> ${new Date(sample.createdAt).toLocaleDateString('tr-TR')}</p>
        <p><strong>Kargo Ücreti:</strong> ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sample.shippingFee)} (KDV Dahil)</p>
      </div>

      <p>Sayın ${sample.customer.name},</p>
      <p>Numune talebiniz onaylanmıştır. Ürünleriniz hazırlanıyor ve en kısa sürede kargoya verilecektir.</p>

      <h3>Talep Edilen Ürünler:</h3>
      <ul>
        ${sample.items.map(item => `<li>${item.title} - ${item.quantity} adet</li>`).join('')}
      </ul>

      <p>Kargo takip numarası oluşturulduğunda size bildirilecektir.</p>
    </div>

    <div class="footer">
      <p>SVD Ambalaj - Plastik Ambalaj Ürünleri</p>
      <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Sayın ${sample.customer.name},

Numune talebiniz onaylanmıştır!

Numune No: ${sample.sampleNumber}
Tarih: ${new Date(sample.createdAt).toLocaleDateString('tr-TR')}
Kargo Ücreti: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sample.shippingFee)} (KDV Dahil)

Talep Edilen Ürünler:
${sample.items.map(item => `- ${item.title} - ${item.quantity} adet`).join('\n')}

Kargo takip numarası oluşturulduğunda size bildirilecektir.

SVD Ambalaj
  `;

  return { subject, html, text };
}

/**
 * New Quote Notification for Admin
 */
export function newQuoteAdminTemplate(quote) {
  const subject = `Yeni Teklif Talebi - ${quote.quoteNumber}`;

  const html = `
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
      <p><strong>Teklif No:</strong> ${quote.quoteNumber}</p>
      <p><strong>Müşteri:</strong> ${quote.customer.name} ${quote.customer.company ? `(${quote.customer.company})` : ''}</p>
      <p><strong>E-posta:</strong> ${quote.customer.email}</p>
      <p><strong>Telefon:</strong> ${quote.customer.phone}</p>

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
          ${quote.items.map(item => `
            <tr>
              <td>${item.title}</td>
              <td>${item.quantity}</td>
              <td>${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p style="font-size: 18px; font-weight: bold;">
        Toplam: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(quote.totals.total)}
      </p>

      <a href="https://svdfirebase000.web.app/admin/quotes" class="button">Admin Panelinde Görüntüle</a>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Yeni Teklif Talebi

Teklif No: ${quote.quoteNumber}
Müşteri: ${quote.customer.name} ${quote.customer.company ? `(${quote.customer.company})` : ''}
E-posta: ${quote.customer.email}
Telefon: ${quote.customer.phone}

Toplam: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(quote.totals.total)}

Admin panelinde görüntüle: https://svdfirebase000.web.app/admin/quotes
  `;

  return { subject, html, text };
}

/**
 * New Sample Request Notification for Admin
 */
export function newSampleAdminTemplate(sample) {
  const subject = `Yeni Numune Talebi - ${sample.sampleNumber}`;

  const html = `
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
      <p><strong>Numune No:</strong> ${sample.sampleNumber}</p>
      <p><strong>Müşteri:</strong> ${sample.customer.name} ${sample.customer.company ? `(${sample.customer.company})` : ''}</p>
      <p><strong>E-posta:</strong> ${sample.customer.email}</p>
      <p><strong>Telefon:</strong> ${sample.customer.phone}</p>

      <h3>Talep Edilen Ürünler:</h3>
      <ul>
        ${sample.items.map(item => `<li>${item.title} - ${item.quantity} adet</li>`).join('')}
      </ul>

      <p><strong>Kargo Ücreti:</strong> ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sample.shippingFee)} (KDV Dahil)</p>

      ${sample.notes ? `<p><strong>Müşteri Notu:</strong> ${sample.notes}</p>` : ''}

      <a href="https://svdfirebase000.web.app/admin/samples" class="button">Admin Panelinde Görüntüle</a>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Yeni Numune Talebi

Numune No: ${sample.sampleNumber}
Müşteri: ${sample.customer.name} ${sample.customer.company ? `(${sample.customer.company})` : ''}
E-posta: ${sample.customer.email}
Telefon: ${sample.customer.phone}

Talep Edilen Ürünler:
${sample.items.map(item => `- ${item.title} - ${item.quantity} adet`).join('\n')}

Kargo Ücreti: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sample.shippingFee)} (KDV Dahil)

${sample.notes ? `Müşteri Notu: ${sample.notes}` : ''}

Admin panelinde görüntüle: https://svdfirebase000.web.app/admin/samples
  `;

  return { subject, html, text };
}
