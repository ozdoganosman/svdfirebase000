"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { resolveServerApiUrl } from "@/lib/server-api";
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
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);

export default function CartPage() {
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
  }, [items.length]);

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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text("SVD Ambalaj", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 10;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Sepet Özeti", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, pageWidth / 2, yPos, { align: "center" });
    
    yPos += 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    yPos += 10;

    // Products
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    items.forEach((item) => {
      const effectivePrice = getEffectivePrice(item);
      const itemTotal = calculateItemTotal(item);
      const totalItemCount = getTotalItemCount(item);

      // Product title
      doc.setFont("helvetica", "bold");
      doc.text(item.title, 15, yPos);
      yPos += 7;

      // Details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      if (item.packageInfo) {
        doc.text(`${item.quantity} ${item.packageInfo.boxLabel} x ${totalItemCount / item.quantity} adet = ${totalItemCount} adet`, 20, yPos);
        yPos += 6;
        doc.text(`Birim fiyat: ${formatCurrency(effectivePrice)}`, 20, yPos);
      } else {
        doc.text(`Miktar: ${item.quantity} adet`, 20, yPos);
        yPos += 6;
        doc.text(`Birim fiyat: ${formatCurrency(effectivePrice)}`, 20, yPos);
      }
      
      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.text(`Toplam: ${formatCurrency(itemTotal)}`, 20, yPos);
      
      yPos += 10;
      doc.setDrawColor(230, 230, 230);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 8;

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Summary
    yPos += 5;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    if (totalBoxes > 0) {
      doc.text(`Toplam Koli: ${totalBoxes}`, 15, yPos);
      yPos += 7;
    }
    
    doc.text(`Toplam Ürün: ${totalItems} adet`, 15, yPos);
    yPos += 7;
    
    const kdvOrani = 0.20;
    const kdvHaricTutar = subtotal / (1 + kdvOrani);
    const kdvTutari = subtotal - kdvHaricTutar;
    
    doc.text(`KDV Hariç Tutar: ${formatCurrency(kdvHaricTutar)}`, 15, yPos);
    yPos += 7;
    doc.text(`KDV (%20): ${formatCurrency(kdvTutari)}`, 15, yPos);
    yPos += 7;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(217, 119, 6);
    doc.text(`Genel Toplam: ${formatCurrency(subtotal)}`, 15, yPos);

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
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
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
                              {formatCurrency(product.price)}
                            </p>
                            <div className="mt-4">
                              <AddToCartButton
                                product={product}
                                variant="primary"
                                className="w-full"
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
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                      {item.packageInfo && (
                        <p className="mt-1 text-xs text-slate-500">
                          📦 {item.packageInfo.itemsPerBox} adet/{item.packageInfo.boxLabel.toLowerCase()}
                        </p>
                      )}
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
                        {formatCurrency(effectivePrice)}
                        {effectivePrice < item.price && (
                          <span className="ml-2 text-xs text-green-600 line-through">
                            {formatCurrency(item.price)}
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
                          {formatCurrency(effectivePrice * item.packageInfo.itemsPerBox)}
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
                      {savings > 0 && ` - ${formatCurrency(savings)} tasarruf`}
                    </div>
                  )}

                  {nextTier && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      💡 {nextTier.minQty - item.quantity} {item.packageInfo?.boxLabel.toLowerCase() || 'adet'} daha ekleyin, 
                      birim fiyat {formatCurrency(nextTier.price)} olsun!
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-700">Toplam</span>
                  <span className="text-xl font-bold text-amber-600">
                    {formatCurrency(itemTotal)}
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
                <dt>Ara toplam</dt>
                <dd className="font-semibold">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <dt>KDV (%20)</dt>
                <dd>{formatCurrency(subtotal * 0.20)}</dd>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <dt>Kargo</dt>
                <dd>Teklifte belirtilecek</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-amber-100 pt-4">
              <div className="flex items-center justify-between text-base font-bold text-amber-700">
                <span>Toplam (KDV Dahil)</span>
                <span>{formatCurrency(subtotal * 1.20)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                KDV hariç: {formatCurrency(subtotal)}
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
