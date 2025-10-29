import PDFDocument from "pdfkit";

/**
 * Generate a PDF for a quote
 * @param {Object} quote - Quote data
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateQuotePDF(quote, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Teklif - ${quote.quoteNumber}`,
          Author: "SVD Ambalaj",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Helper function for currency formatting
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
          minimumFractionDigits: 2,
        }).format(amount);
      };

      // Company Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("SVD AMBALAJ", { align: "center" });

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Plastik Ambalaj Ürünleri", { align: "center" })
        .moveDown(2);

      // Quote Number and Date
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(`TEKLİF NO: ${quote.quoteNumber || ""}`, { align: "left" });

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Tarih: ${new Date(quote.createdAt).toLocaleDateString("tr-TR")}`, {
          align: "left",
        });

      if (quote.validUntil) {
        doc.text(
          `Geçerlilik: ${new Date(quote.validUntil).toLocaleDateString("tr-TR")}`,
          { align: "left" }
        );
      }

      doc.moveDown(1.5);

      // Customer Information
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("MÜŞTERİ BİLGİLERİ", { underline: true });

      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      if (quote.customer.company) {
        doc.text(`Firma: ${quote.customer.company}`);
      }
      doc.text(`Ad Soyad: ${quote.customer.name}`);
      if (quote.customer.taxNumber) {
        doc.text(`Vergi No: ${quote.customer.taxNumber}`);
      }
      doc.text(`E-posta: ${quote.customer.email}`);
      doc.text(`Telefon: ${quote.customer.phone}`);
      if (quote.customer.address) {
        doc.text(`Adres: ${quote.customer.address}`);
        if (quote.customer.city) {
          doc.text(`Şehir: ${quote.customer.city}`);
        }
      }

      doc.moveDown(2);

      // Items Table Header
      doc.fontSize(12).font("Helvetica-Bold").text("ÜRÜNLER", { underline: true });
      doc.moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      const itemCol = 50;
      const qtyCol = 320;
      const priceCol = 380;
      const totalCol = 480;

      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Ürün", itemCol, tableTop);
      doc.text("Miktar", qtyCol, tableTop);
      doc.text("Birim Fiyat", priceCol, tableTop);
      doc.text("Toplam", totalCol, tableTop);

      // Draw line under header
      doc
        .moveTo(itemCol, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Items
      let y = tableTop + 25;
      doc.fontSize(9).font("Helvetica");

      quote.items.forEach((item, index) => {
        // Check if we need a new page
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const rowHeight = 20;

        // Item name (wrap if too long)
        doc.text(item.title, itemCol, y, {
          width: 260,
          height: rowHeight,
        });

        // Quantity
        doc.text(item.quantity.toString(), qtyCol, y, {
          width: 50,
          align: "right",
        });

        // Unit Price
        doc.text(formatCurrency(item.price), priceCol, y, {
          width: 90,
          align: "right",
        });

        // Total
        doc.text(formatCurrency(item.subtotal), totalCol, y, {
          width: 70,
          align: "right",
        });

        y += rowHeight + 5;

        // Draw line between items
        if (index < quote.items.length - 1) {
          doc
            .moveTo(itemCol, y - 2)
            .lineTo(550, y - 2)
            .strokeOpacity(0.3)
            .stroke()
            .strokeOpacity(1);
        }
      });

      // Move down after table
      doc.y = y + 10;

      // Draw thick line before totals
      doc
        .moveTo(itemCol, doc.y)
        .lineTo(550, doc.y)
        .lineWidth(2)
        .stroke()
        .lineWidth(1);

      doc.moveDown(1);

      // Totals
      const totalsX = 380;
      const totalsLabelX = 320;

      doc.fontSize(10).font("Helvetica");
      doc.text("Ara Toplam:", totalsLabelX, doc.y);
      doc.text(formatCurrency(quote.totals.subtotal), totalsX, doc.y, {
        width: 170,
        align: "right",
      });

      doc.moveDown(0.5);
      doc.text("KDV (%20):", totalsLabelX, doc.y);
      doc.text(formatCurrency(quote.totals.tax), totalsX, doc.y, {
        width: 170,
        align: "right",
      });

      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("GENEL TOPLAM:", totalsLabelX, doc.y);
      doc.text(formatCurrency(quote.totals.total), totalsX, doc.y, {
        width: 170,
        align: "right",
      });

      doc.moveDown(2);

      // Payment Terms
      if (quote.paymentTerms) {
        doc.fontSize(12).font("Helvetica-Bold").text("ÖDEME ŞARTLARI", {
          underline: true,
        });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");

        const termMonths = quote.paymentTerms.termMonths || 0;
        doc.text(
          `Vade: ${termMonths === 0 ? "Peşin" : `${termMonths} Ay`}`
        );

        if (quote.paymentTerms.guaranteeType) {
          const guaranteeTypes = {
            check: "Çek",
            teminat: "Teminat Mektubu",
            açık: "Açık Hesap",
          };
          doc.text(
            `Teminat Türü: ${guaranteeTypes[quote.paymentTerms.guaranteeType] || quote.paymentTerms.guaranteeType}`
          );
        }

        if (quote.paymentTerms.guaranteeDetails) {
          doc.text(`Detaylar: ${quote.paymentTerms.guaranteeDetails}`);
        }

        doc.moveDown(1);
      }

      // Important Notes
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("ÖNEMLİ NOTLAR", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).font("Helvetica");

      doc.text(
        "• Yukarıdaki fiyatlar peşin ödeme için geçerlidir. Vadeli ödemelerde fiyatlar değişiklik gösterebilir.",
        { lineGap: 4 }
      );
      doc.text(
        "• Bu teklif " +
          (quote.validUntil
            ? new Date(quote.validUntil).toLocaleDateString("tr-TR")
            : "30 gün") +
          " tarihine kadar geçerlidir.",
        { lineGap: 4 }
      );
      doc.text("• Fiyatlarımız KDV hariçtir.", { lineGap: 4 });
      doc.text("• Teslimat süresi sipariş onayından sonra belirtilecektir.", {
        lineGap: 4,
      });

      // Admin Notes
      if (quote.adminNotes) {
        doc.moveDown(1);
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Admin Notları:", { continued: true })
          .font("Helvetica")
          .text(` ${quote.adminNotes}`);
      }

      // Footer
      doc.fontSize(8).font("Helvetica").text(
        "Bu teklif SVD Ambalaj tarafından hazırlanmıştır.",
        50,
        750,
        { align: "center", lineGap: 2 }
      );

      doc.text("İletişim: info@svdambalaj.com | Tel: (0XXX) XXX XX XX", {
        align: "center",
      });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
