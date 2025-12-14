#!/usr/bin/env node

/**
 * Test Email Sender
 * Firebase Firestore'a test email dokümanı ekler
 */

const admin = require("firebase-admin");

// Firebase Admin başlat
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "svdfirebase000"
  });
}

const db = admin.firestore();

async function sendTestEmail() {
  console.log("📧 Test email gönderiliyor...\n");

  const testEmail = {
    to: "mhmtclk1634@gmail.com", // Değiştirilebilir
    message: {
      subject: "SVD Ambalaj - Email Sistemi Test",
      text: "Bu bir test emailidir. Email sistemi çalışıyor! ✅",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .success { background: #10b981; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 SVD AMBALAJ</h1>
              <p>Email Sistemi Test</p>
            </div>
            <div class="content">
              <div class="success">
                <strong>✅ Email Sistemi Başarıyla Kuruldu!</strong>
              </div>
              <p>Merhaba,</p>
              <p>Bu email, SVD Ambalaj email sisteminin başarıyla çalıştığını doğrulamak için gönderilmiştir.</p>
              <h3>Test Edilen Özellikler:</h3>
              <ul>
                <li>✅ Firebase Trigger Email Extension</li>
                <li>✅ Firestore mail collection</li>
                <li>✅ SMTP bağlantısı (mail.spreyvalfdunyasi.com)</li>
                <li>✅ HTML email formatting</li>
                <li>✅ Email delivery tracking</li>
              </ul>
              <p><strong>Sonraki Adımlar:</strong></p>
              <ol>
                <li>Quote onay emaillerini test et</li>
                <li>Sample onay emaillerini test et</li>
                <li>VIP sistemini test et</li>
                <li>Quote-to-order conversion test et</li>
              </ol>
              <p>Email sistemi tam çalışır durumda! 🚀</p>
            </div>
            <div class="footer">
              <p>SVD Ambalaj © 2025 | Tüm hakları saklıdır.</p>
              <p>Bu bir otomatik test emailidir.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };

  try {
    // Firestore'a email dokümanı ekle
    const docRef = await db.collection("mail").add(testEmail);

    console.log("✅ Test email dokümanı oluşturuldu!");
    console.log(`📄 Document ID: ${docRef.id}`);
    console.log(`📧 Alıcı: ${testEmail.to}`);
    console.log(`📝 Konu: ${testEmail.message.subject}\n`);

    console.log("⏳ Email gönderimi için 10-30 saniye bekleyin...");
    console.log("📊 Durumu kontrol etmek için:");
    console.log(`   https://console.firebase.google.com/project/svdfirebase000/firestore/data/mail/${docRef.id}\n`);

    // 30 saniye bekle ve durumu kontrol et
    console.log("⏰ 30 saniye bekleniyor...\n");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Dokümanı tekrar oku
    const doc = await docRef.get();
    const data = doc.data();

    if (data.delivery) {
      console.log("📬 Email Delivery Durumu:");
      console.log(`   State: ${data.delivery.state}`);

      if (data.delivery.state === "SUCCESS") {
        console.log("   ✅ Email başarıyla gönderildi!");
        console.log(`   📨 Message ID: ${data.delivery.info?.messageId || "N/A"}`);
        console.log(`   ⏰ Gönderim zamanı: ${data.delivery.endTime || "N/A"}`);
        console.log("\n🎉 TEST BAŞARILI! Email kutunuzu kontrol edin.");
      } else if (data.delivery.state === "ERROR") {
        console.log("   ❌ Email gönderilemedi!");
        console.log(`   Hata: ${data.delivery.error || "Bilinmeyen hata"}`);
        console.log("\n⚠️  SMTP ayarlarını kontrol edin.");
      } else {
        console.log("   ⏳ Email hala işleniyor...");
        console.log("   Birkaç dakika sonra Firestore'dan kontrol edin.");
      }
    } else {
      console.log("⏳ Email henüz işlenmedi.");
      console.log("   Extension loglarını kontrol edin:");
      console.log("   https://console.firebase.google.com/project/svdfirebase000/extensions/instances/firestore-send-email\n");
    }

  } catch (error) {
    console.error("❌ Hata:", error.message);
    console.error(error);
  }

  process.exit(0);
}

// Script çalıştır
sendTestEmail();
