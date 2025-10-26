"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { resolveServerApiUrl } from "@/lib/server-api";
import { getCurrentRate, formatDualPrice } from "@/lib/currency";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { jsPDF } from "jspdf";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  stock?: number;
  images?: string[];
  bulkPricing?: { minQty: number; price: number }[];
  packageInfo?: {
    itemsPerBox: number;
    minBoxes: number;
    boxLabel: string;
  };
  specifications?: {
    hoseLength?: string;
    volume?: string;
    color?: string;
    neckSize?: string;
  };
};



export default function CartPage() {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    subtotal,
    totalBoxes,
    totalItems,
    getEffectivePrice,
    getAppliedTier,
    getNextTier,
    calculateItemTotal,
    getTotalItemCount
  } = useCart();

  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Fetch exchange rate on mount
    getCurrentRate().then(rate => setExchangeRate(rate.rate)).catch(() => setExchangeRate(null));
    if (items.length === 0) {
      fetch(resolveServerApiUrl("/products"))
        .then((res) => res.json())
        .then((data) => {
          const products = data.products || [];
          // Get random 4 products
          const shuffled = products.sort(() => 0.5 - Math.random());
          setRecommendedProducts(shuffled.slice(0, 4));
        })
        .catch(console.error);
    }
  }, [items]);

  const handleQuantityChange = (productId: string, value: string, packageInfo?: { itemsPerBox: number; minBoxes: number; boxLabel: string }) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    // Enforce minimum boxes if packageInfo exists
    if (packageInfo && parsed < packageInfo.minBoxes) {
      return;
    }
    updateQuantity(productId, parsed);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = margin;

    // Helper function to format USD amounts with thousand separators
    const formatUSD = (amount: number): string => {
      return amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).replace(/,/g, '.');
    };

    // Helper function for Turkish text
    const addText = (text: string, x: number, y: number, options?: { align?: "left" | "center" | "right" }) => {
      // Convert Turkish characters to ASCII equivalents for better rendering
      const turkishMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'I': 'I',
        'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      };
      
      let cleanText = text;
      Object.keys(turkishMap).forEach(key => {
        cleanText = cleanText.replace(new RegExp(key, 'g'), turkishMap[key]);
      });
      
      doc.text(cleanText, x, y, options);
    };

    // Header with logo area
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    addText("SVD AMBALAJ", pageWidth / 2, 18, { align: "center" });
    
    doc.setFontSize(14);
    addText("SEPET OZETI", pageWidth / 2, 28, { align: "center" });
    
    // Date and document info
    yPos = 50;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    addText(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, margin, yPos);
    addText(`Belge No: SVD-${Date.now()}`, pageWidth - margin, yPos, { align: "right" });
    
    yPos += 10;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 10;

    // Products table header
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    addText("URUN", margin + 2, yPos + 5);
    addText("MIKTAR", margin + 100, yPos + 5);
    addText("BIRIM FIYAT", margin + 130, yPos + 5);
    addText("TOPLAM", pageWidth - margin -15, yPos + 5);
    
    yPos += 12;

    // Products
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const rate = exchangeRate || 0;
    
    items.forEach((item, index) => {
      const effectivePrice = getEffectivePrice(item);
      const itemTotal = calculateItemTotal(item);
      const totalItemCount = getTotalItemCount(item);

      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, yPos - 4, contentWidth, 16, 'F');
      }

      // Product name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const maxTitleWidth = 90;
      const titleLines = doc.splitTextToSize(item.title, maxTitleWidth);
      addText(titleLines[0], margin + 2, yPos);
      
      // Quantity details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      if (item.packageInfo) {
        addText(`${item.quantity} ${item.packageInfo.boxLabel}`, margin + 100, yPos);
        addText(`(${totalItemCount.toLocaleString('tr-TR')} adet)`, margin + 100, yPos + 4);
      } else {
        addText(`${item.quantity} adet`, margin + 100, yPos);
      }
      
      // Unit price
      doc.setFontSize(8);
      const unitPriceText = rate ? 
        `$${formatUSD(effectivePrice)}` : 
        `${effectivePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`;
      addText(unitPriceText, margin + 135, yPos);
      
      // Total price
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(217, 119, 6);
      const totalPriceText = rate ? 
        `$${formatUSD(itemTotal)}` : 
        `${itemTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`;
      addText(totalPriceText, pageWidth - margin - 2, yPos, { align: "right" });
      
      yPos += 18;
      
      // Light separator
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    });

    // Summary section
    yPos += 5;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    if (totalBoxes > 0) {
      addText(`Toplam Koli:`, margin, yPos);
      addText(`${totalBoxes}`, pageWidth - margin - 2, yPos, { align: "right" });
      yPos += 6;
    }
    
    addText(`Toplam Urun:`, margin, yPos);
    addText(`${totalItems.toLocaleString('tr-TR')} adet`, pageWidth - margin - 2, yPos, { align: "right" });
    yPos += 8;
    
    const kdvOrani = 0.20;
    const kdvHaricTutar = subtotal / (1 + kdvOrani);
    const kdvTutari = subtotal - kdvHaricTutar;
    
    addText(`KDV Haric Tutar:`, margin, yPos);
    const subtotalText = rate ? 
      `$${formatUSD(kdvHaricTutar)}` : 
      `${kdvHaricTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`;
    addText(subtotalText, pageWidth - margin - 2, yPos, { align: "right" });
    yPos += 6;
    
    addText(`KDV (%20):`, margin, yPos);
    const kdvText = rate ? 
      `$${formatUSD(kdvTutari)}` : 
      `${kdvTutari.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`;
    addText(kdvText, pageWidth - margin - 2, yPos, { align: "right" });
    yPos += 10;
    
    // Grand total box
    doc.setFillColor(217, 119, 6);
    doc.rect(margin, yPos - 4, contentWidth, 12, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    addText(`GENEL TOPLAM:`, margin + 2, yPos + 4);
    const grandTotalText = rate ? 
      `$${formatUSD(subtotal)}` : 
      `${subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`;
    addText(grandTotalText, pageWidth - margin - 2, yPos + 4, { align: "right" });

    // Footer
    yPos = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    addText("SVD Ambalaj - Kaliteli Ambalaj Cozumleri", pageWidth / 2, yPos, { align: "center" });
    addText("www.svdambalaj.com | info@svdambalaj.com | 0850 123 45 67", pageWidth / 2, yPos + 4, { align: "center" });

    // Save
    doc.save(`SVD-Sepet-${new Date().getTime()}.pdf`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
              Sepetiniz
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Siparişinizi tamamlamaya hazırsınız</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Ürün adetlerini güncelleyebilir, istediğiniz ürünleri çıkarabilir ve siparişinizi tamamlamak için ödeme adımına geçebilirsiniz.
            </p>
          </div>
          <div className="flex gap-3">
            {items.length > 0 && (
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500 px-6 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF İndir
              </button>
            )}
            <Link
              href="/checkout"
              className="inline-flex items-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600"
            >
              Siparişi Tamamla
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {items.length === 0 && (
              <div className="space-y-8">
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">Sepetiniz Boş</h3>
                  <p className="mt-2">
                    Ürünleri incelemek için{" "}
                    <Link href="/" className="font-semibold text-amber-600 hover:underline">
                      anasayfaya dönün
                    </Link>
                    .
                  </p>
                </div>

                {recommendedProducts.length > 0 && (
                  <div>
                    <h2 className="mb-6 text-2xl font-bold text-slate-900">Önerilen Ürünler</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                      {recommendedProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                        >
                          <Link href={`/products/${product.slug}`} className="block aspect-square overflow-hidden bg-slate-100">
                            {product.images && product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 50vw"
                                className="object-contain p-4 transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-400">
                                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </Link>
                          <div className="p-5">
                            <Link href={`/products/${product.slug}`}>
                              <h3 className="font-semibold text-slate-900 transition hover:text-amber-600">
                                {product.title}
                              </h3>
                            </Link>
                            <p className="mt-2 text-xl font-bold text-amber-600">
                              {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, product.price) : "₺" + product.price.toLocaleString("tr-TR")}
                              <span className="text-sm font-normal text-slate-500">+KDV</span>
                            </p>
                            <div className="mt-4">
                              <AddToCartButton
                                product={product}
                                variant="primary"
                                className="w-full"
                                showQuantitySelector={false}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {items.map((item) => {
              const effectivePrice = getEffectivePrice(item);
              const appliedTier = getAppliedTier(item);
              const nextTier = getNextTier(item);
              const itemTotal = calculateItemTotal(item);
              const totalItemCount = getTotalItemCount(item);
              const savings = item.packageInfo 
                ? (item.price - effectivePrice) * totalItemCount
                : (item.price - effectivePrice) * item.quantity;

              return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 items-start">
                      {/* Product Image */}
                      {item.images && item.images[0] ? (
                        <div className="relative h-20 w-20 flex-shrink-0">
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            sizes="80px"
                            className="object-contain rounded-lg border border-slate-100 bg-slate-50 p-1"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-300">
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                        {item.packageInfo && (
                          <p className="mt-1 text-xs text-slate-500">
                            📦 {item.packageInfo.itemsPerBox} adet/{item.packageInfo.boxLabel.toLowerCase()}
                          </p>
                        )}
                        {/* Teknik Özellikler */}
                        {(item.specifications?.hoseLength || item.specifications?.volume || item.specifications?.color || item.specifications?.neckSize) && (
                          <ul className="mt-1 text-xs text-slate-600">
                            {item.specifications?.hoseLength && (
                              <li>• Hortum Boyu: {item.specifications.hoseLength}</li>
                            )}
                            {item.specifications?.volume && (
                              <li>• Hacim: {item.specifications.volume}</li>
                            )}
                            {item.specifications?.color && (
                              <li>• Renk: {item.specifications.color}</li>
                            )}
                            {item.specifications?.neckSize && (
                              <li>• Boyun Ölçüsü: {item.specifications.neckSize}</li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                    >
                      Kaldır
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        {item.packageInfo ? 'Birim Fiyat' : 'Fiyat'}
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, effectivePrice) : "₺" + effectivePrice.toLocaleString("tr-TR")}
                        <span className="text-xs font-normal text-slate-500">+KDV</span>
                        {effectivePrice < item.price && (
                          <span className="ml-2 text-xs text-green-600 line-through">
                            {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, item.price) : "₺" + item.price.toLocaleString("tr-TR")}
                          </span>
                        )}
                      </p>
                    </div>
                    {item.packageInfo && (
                      <div>
                        <p className="text-xs text-slate-500">
                          {item.packageInfo.boxLabel} Fiyatı
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, item.packageInfo.itemsPerBox, effectivePrice) : "₺" + (effectivePrice * item.packageInfo.itemsPerBox).toLocaleString("tr-TR")}
                          <span className="text-xs font-normal text-slate-500">+KDV</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="text-sm font-semibold text-slate-700">
                      {item.packageInfo ? `${item.packageInfo.boxLabel} Sayısı` : 'Adet'}
                      <input
                        type="number"
                        min={item.packageInfo?.minBoxes || 1}
                        value={item.quantity}
                        onChange={(event) => handleQuantityChange(item.id, event.target.value, item.packageInfo)}
                        className="ml-3 w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      />
                    </label>
                    {item.packageInfo && (
                      <p className="text-xs text-slate-500">
                        = {totalItemCount.toLocaleString('tr-TR')} adet
                      </p>
                    )}
                  </div>

                  {appliedTier && (
                    <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
                      ✅ Toplu alım indirimi uygulandı! ({appliedTier.minQty}+ {item.packageInfo?.boxLabel.toLowerCase() || 'adet'})
                      {savings > 0 && ` - ${exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, savings) : "₺" + savings.toLocaleString("tr-TR")} tasarruf`}
                    </div>
                  )}

                  {nextTier && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      💡 {nextTier.minQty - item.quantity} {item.packageInfo?.boxLabel.toLowerCase() || 'adet'} daha ekleyin, 
                      birim fiyat {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, nextTier.price) : "₺" + nextTier.price.toLocaleString("tr-TR")} +KDV olsun!
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-700">Toplam (KDV Hariç)</span>
                  <span className="text-xl font-bold text-amber-600">
                    {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, itemTotal) : "₺" + itemTotal.toLocaleString("tr-TR")}
                    <span className="text-sm font-normal text-slate-500">+KDV</span>
                  </span>
                </div>
              </div>
              );
            })}
          </div>

          <aside className="rounded-2xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-800">Sipariş Özeti</h2>
            <dl className="mt-6 space-y-3 text-sm">
              {totalBoxes > 0 && (
                <div className="flex items-center justify-between text-slate-700">
                  <dt>Toplam Koli</dt>
                  <dd className="font-semibold">{totalBoxes.toLocaleString('tr-TR')}</dd>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-700">
                <dt>Toplam Ürün</dt>
                <dd className="font-semibold">{totalItems.toLocaleString('tr-TR')} adet</dd>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <dt>Ara toplam (KDV Hariç)</dt>
                <dd className="font-semibold">{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, subtotal) : "₺" + subtotal.toLocaleString("tr-TR")} <span className="text-xs font-normal text-slate-500">+KDV</span></dd>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <dt>KDV (%20)</dt>
                <dd>{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, subtotal * 0.20) : "₺" + (subtotal * 0.20).toLocaleString("tr-TR")}</dd>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <dt className="flex items-center gap-1">
                  Kargo
                  {totalItems >= 50000 && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Bedava</span>
                  )}
                </dt>
                <dd className="font-semibold">
                  {totalItems >= 50000 ? (
                    <span className="text-green-600">{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, 0) : "₺0"}</span>
                  ) : (
                    <>
                      {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, totalBoxes * 120) : "₺" + (totalBoxes * 120).toLocaleString("tr-TR")}
                      <span className="ml-1 text-xs font-normal text-slate-500">
                        ({totalBoxes} koli × ₺120)
                      </span>
                    </>
                  )}
                </dd>
              </div>
              {totalItems < 50000 && totalItems > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold">💡 Kargo Avantajı</p>
                  <p className="mt-1">
                    {(50000 - totalItems).toLocaleString('tr-TR')} adet daha sipariş vererek <span className="font-semibold">ücretsiz kargo</span> kazanın!
                  </p>
                </div>
              )}
            </dl>
            <div className="mt-6 border-t border-amber-100 pt-4">
              <div className="flex items-center justify-between text-base font-bold text-amber-700">
                <span>Genel Toplam (KDV Dahil)</span>
                <span>{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, (subtotal * 1.20) + (totalItems >= 50000 ? 0 : totalBoxes * 120)) : "₺" + ((subtotal * 1.20) + (totalItems >= 50000 ? 0 : totalBoxes * 120)).toLocaleString("tr-TR")}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                KDV hariç: {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, subtotal + (totalItems >= 50000 ? 0 : totalBoxes * 120)) : "₺" + (subtotal + (totalItems >= 50000 ? 0 : totalBoxes * 120)).toLocaleString("tr-TR")} +KDV
              </p>
            </div>
            <Link
              href="/checkout"
              className="mt-6 block rounded-full bg-amber-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600"
            >
              Siparişe Devam Et
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
