"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { resolveServerApiUrl } from "@/lib/server-api";
import { getCurrentRate, formatDualPrice } from "@/lib/currency";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { jsPDF } from "jspdf";
import { useAuth } from "@/context/AuthContext";

type Product = {
  id: string;
  title: string;
  slug: string;
  price?: number;
  priceUSD?: number;
  priceTRY?: number;
  stock?: number;
  images?: string[];
  bulkPricing?: { minQty: number; price: number }[];
  bulkPricingUSD?: { minQty: number; price: number }[];
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
  const { user, vipStatus } = useAuth();
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    totalBoxes,
    totalItems,
    comboDiscount,
    comboMatches,
    comboDiscountLabel,
    getEffectivePrice,
    getAppliedTier,
    getNextTier,
    calculateItemTotal,
    getTotalItemCount
  } = useCart();

  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  // Helper function to get combo quantity for an item
  const getItemComboQuantity = (itemId: string): number => {
    for (const match of comboMatches) {
      if (match.itemComboQuantities && match.itemComboQuantities[itemId]) {
        return match.itemComboQuantities[itemId];
      }
    }
    return 0;
  };

  // Calculate VIP-discounted subtotal
  const vipDiscount = vipStatus?.discount || 0;
  const vipSubtotal = items.reduce((total, item) => {
    const bulkPrice = getEffectivePrice(item);
    const vipPrice = bulkPrice * (1 - vipDiscount / 100);
    const totalItemCount = getTotalItemCount(item);
    return total + (vipPrice * totalItemCount);
  }, 0);

  // Modal states
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  // Quote form states
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    taxNumber: "",
    address: "",
    city: "",
    termMonths: "1",
    guaranteeType: "check" as "check" | "teminat" | "açık",
    guaranteeDetails: "",
    notes: ""
  });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  // Sample form states
  const [sampleForm, setSampleForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleSuccess, setSampleSuccess] = useState(false);
  const [sampleError, setSampleError] = useState("");

  // Fetch user profile and auto-fill forms
  useEffect(() => {
    if (user?.uid) {
      // Fetch user profile
      fetch(resolveServerApiUrl(`/user/profile?userId=${user.uid}`))
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            const userProfile = data.user;

            // Fetch default address
            fetch(resolveServerApiUrl(`/user/addresses?userId=${user.uid}`))
              .then((res) => res.json())
              .then((addressData) => {
                const addresses = addressData.addresses || [];
                const defaultAddress = addresses.find((addr: { isDefault?: boolean; fullName?: string; phone?: string; address?: string; city?: string }) => addr.isDefault) || addresses[0];

                // Auto-fill quote form
                setQuoteForm((prev) => ({
                  ...prev,
                  name: userProfile.displayName || defaultAddress?.fullName || prev.name,
                  company: userProfile.company || prev.company,
                  email: userProfile.email || prev.email,
                  phone: userProfile.phone || defaultAddress?.phone || prev.phone,
                  taxNumber: userProfile.taxNumber || prev.taxNumber,
                  address: defaultAddress?.address || prev.address,
                  city: defaultAddress?.city || prev.city,
                }));

                // Auto-fill sample form
                setSampleForm((prev) => ({
                  ...prev,
                  name: userProfile.displayName || defaultAddress?.fullName || prev.name,
                  company: userProfile.company || prev.company,
                  email: userProfile.email || prev.email,
                  phone: userProfile.phone || defaultAddress?.phone || prev.phone,
                }));
              })
              .catch((error) => {
                console.error("Error fetching addresses:", error);
                // Still auto-fill with user profile data
                setQuoteForm((prev) => ({
                  ...prev,
                  name: userProfile.displayName || prev.name,
                  company: userProfile.company || prev.company,
                  email: userProfile.email || prev.email,
                  phone: userProfile.phone || prev.phone,
                  taxNumber: userProfile.taxNumber || prev.taxNumber,
                }));

                setSampleForm((prev) => ({
                  ...prev,
                  name: userProfile.displayName || prev.name,
                  company: userProfile.company || prev.company,
                  email: userProfile.email || prev.email,
                  phone: userProfile.phone || prev.phone,
                }));
              });
          }
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
        });
    }
  }, [user]);

  useEffect(() => {
    // Fetch exchange rate on mount
    getCurrentRate().then(rate => setExchangeRate(rate.rate)).catch(() => setExchangeRate(null));
    if (items.length === 0) {
      fetch(resolveServerApiUrl("/products"))
        .then((res) => res.json())
        .then((data) => {
          const products = data.products || [];
          console.log('[Cart] Total products fetched:', products.length);
          console.log('[Cart] Sample product data:', products[0]);
          // Get random 4 products
          const shuffled = products.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 4);
          console.log('[Cart] Selected products:', selected);
          setRecommendedProducts(selected);
        })
        .catch((error) => {
          console.error('[Cart] Error fetching products:', error);
        });
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

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteLoading(true);
    setQuoteError("");

    try {
      // Prepare quote items
      const quoteItems = items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: getEffectivePrice(item),
        subtotal: calculateItemTotal(item)
      }));

      // Calculate totals
      const kdvOrani = 0.20;
      const kdvHaricTutar = subtotal;
      const kdvTutari = subtotal * kdvOrani;
      const toplamTutar = subtotal * (1 + kdvOrani);

      const payload = {
        customer: {
          name: quoteForm.name,
          company: quoteForm.company,
          email: quoteForm.email,
          phone: quoteForm.phone,
          taxNumber: quoteForm.taxNumber,
          address: quoteForm.address,
          city: quoteForm.city,
          userId: user?.uid || null
        },
        items: quoteItems,
        totals: {
          subtotal: kdvHaricTutar,
          tax: kdvTutari,
          total: toplamTutar,
          currency: "TRY"
        },
        paymentTerms: {
          termMonths: parseInt(quoteForm.termMonths),
          guaranteeType: quoteForm.guaranteeType,
          guaranteeDetails: quoteForm.guaranteeDetails
        },
        notes: quoteForm.notes
      };

      const response = await fetch(resolveServerApiUrl("/quotes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Teklif gönderilirken bir hata oluştu.");
      }

      await response.json();
      setQuoteSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setShowQuoteModal(false);
        setQuoteSuccess(false);
        setQuoteForm({
          name: "",
          company: "",
          email: "",
          phone: "",
          taxNumber: "",
          address: "",
          city: "",
          termMonths: "1",
          guaranteeType: "check",
          guaranteeDetails: "",
          notes: ""
        });
      }, 2000);
    } catch (error) {
      console.error("Quote submission error:", error);
      setQuoteError(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSampleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSampleLoading(true);
    setSampleError("");

    try {
      // Prepare sample items (just id and title)
      const sampleItems = items.map(item => ({
        id: item.id,
        title: item.title
      }));

      const payload = {
        customer: {
          name: sampleForm.name,
          company: sampleForm.company,
          email: sampleForm.email,
          phone: sampleForm.phone,
          userId: user?.uid || null
        },
        items: sampleItems,
        notes: sampleForm.notes
      };

      const response = await fetch(resolveServerApiUrl("/samples/from-cart"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Numune talebi gönderilirken bir hata oluştu.");
      }

      await response.json();
      setSampleSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setShowSampleModal(false);
        setSampleSuccess(false);
        setSampleForm({
          name: "",
          company: "",
          email: "",
          phone: "",
          notes: ""
        });
      }, 2000);
    } catch (error) {
      console.error("Sample submission error:", error);
      setSampleError(error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setSampleLoading(false);
    }
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
          {items.length > 0 && (
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 hover:shadow-xl"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Siparişe Devam Et
            </Link>
          )}
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

                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-blue-900">Numune veya Teklif Talebinde Bulunmak İçin</h4>
                      <p className="mt-2 text-sm text-blue-800">
                        Numune talebi veya fiyat teklifi alabilmek için öncelikle ilgilendiğiniz ürünleri ve talep ettiğiniz miktarları sepete eklemeniz gerekmektedir.
                        Sepetinize ürün ekledikten sonra <strong>&quot;Numune Talebi&quot;</strong> veya <strong>&quot;Teklif Al&quot;</strong> butonlarını kullanarak talebinizi oluşturabilirsiniz.
                      </p>
                      <div className="mt-4">
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Ürünleri İncele
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {recommendedProducts.length > 0 && (
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900">Bunları da beğenebilirsiniz</h2>
                        <p className="mt-1 text-sm text-slate-600">Size özel seçtiğimiz ürünler</p>
                      </div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {recommendedProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/50"
                        >
                          <Link href={`/products/${product.slug}`} className="relative block h-52 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                            {product.images && product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-contain p-4 transition duration-500 group-hover:scale-110 group-hover:rotate-2"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-400">
                                <svg className="h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-amber-600 shadow-md backdrop-blur-sm">
                              Önerilen
                            </div>
                          </Link>
                          <div className="p-4">
                            <Link href={`/products/${product.slug}`}>
                              <h3 className="line-clamp-2 h-12 text-sm font-semibold text-slate-900 transition hover:text-amber-600">
                                {product.title}
                              </h3>
                            </Link>

                            {/* Product Specifications */}
                            {product.specifications && (
                              <div className="mt-2 space-y-0.5">
                                {product.specifications.volume && (
                                  <p className="text-xs text-slate-600">📏 {product.specifications.volume}</p>
                                )}
                                {product.specifications.color && (
                                  <p className="text-xs text-slate-600">🎨 {product.specifications.color}</p>
                                )}
                                {product.specifications.hoseLength && (
                                  <p className="text-xs text-slate-600">📐 Hortum: {product.specifications.hoseLength}</p>
                                )}
                                {product.specifications.neckSize && (
                                  <p className="text-xs text-slate-600">⭕ Boyun: {product.specifications.neckSize}</p>
                                )}
                              </div>
                            )}

                            {/* Package Info */}
                            {product.packageInfo && (
                              <p className="mt-2 text-xs text-slate-500">
                                📦 {product.packageInfo.itemsPerBox} adet/{product.packageInfo.boxLabel.toLowerCase()}
                              </p>
                            )}

                            {/* Stock Status */}
                            {product.stock !== undefined && (
                              <div className="mt-2">
                                {product.stock > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Stokta
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    Stokta yok
                                  </span>
                                )}
                              </div>
                            )}

                            {(product.price !== undefined && product.price !== null) || (product.priceUSD !== undefined && product.priceUSD !== null) ? (
                              <>
                                <div className="mt-3">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-base font-bold text-amber-600">
                                      {(() => {
                                        // If product has TRY price, use it
                                        if (product.price !== undefined && product.price !== null) {
                                          return exchangeRate
                                            ? formatDualPrice(undefined, exchangeRate, true, 1, product.price)
                                            : "₺" + product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
                                        }
                                        // If product only has USD price, convert to TRY
                                        if (product.priceUSD !== undefined && product.priceUSD !== null && exchangeRate) {
                                          const tryPrice = product.priceUSD * exchangeRate;
                                          return "₺" + tryPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
                                        }
                                        // Show USD price if no exchange rate
                                        if (product.priceUSD !== undefined && product.priceUSD !== null) {
                                          return "$" + product.priceUSD.toLocaleString("en-US", { minimumFractionDigits: 2 });
                                        }
                                        return "İletişime geçin";
                                      })()}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">+KDV</span>
                                  </div>
                                  {/* USD Price Display */}
                                  {(() => {
                                    // If product has TRY price and exchange rate, show USD equivalent
                                    if (product.price !== undefined && product.price !== null && exchangeRate && exchangeRate > 0) {
                                      const usdPrice = product.price / exchangeRate;
                                      return (
                                        <span className="text-xs text-slate-500">
                                          (${usdPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                        </span>
                                      );
                                    }
                                    // If product has USD price and exchange rate, show original USD price
                                    if (product.priceUSD !== undefined && product.priceUSD !== null && exchangeRate) {
                                      return (
                                        <span className="text-xs text-slate-500">
                                          (${product.priceUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>

                                {/* Bulk Pricing Info */}
                                {((product.bulkPricing && product.bulkPricing.length > 0) || (product.bulkPricingUSD && product.bulkPricingUSD.length > 0)) && (
                                  <p className="mt-1 text-xs text-green-600 font-medium">
                                    💰 Toplu alımda indirim
                                  </p>
                                )}

                                <div className="mt-2">
                                  <AddToCartButton
                                    product={product}
                                    variant="primary"
                                    className="w-full !rounded-lg !py-2 !text-xs !font-semibold shadow-sm shadow-amber-500/20 transition hover:!shadow-md hover:!shadow-amber-500/30"
                                    showQuantitySelector={false}
                                  />
                                </div>
                              </>
                            ) : (
                              <p className="mt-3 text-sm font-medium text-slate-400">İletişime geçin</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {items.map((item) => {
              const bulkEffectivePrice = getEffectivePrice(item);
              // Apply VIP discount on top of bulk pricing
              const vipDiscount = vipStatus?.discount || 0;
              const effectivePrice = bulkEffectivePrice * (1 - vipDiscount / 100);
              const appliedTier = getAppliedTier(item);
              const nextTier = getNextTier(item);
              const totalItemCount = getTotalItemCount(item);
              const itemTotal = effectivePrice * totalItemCount;

              // Calculate base price (before any discounts) - use priceUSD converted to TRY
              const basePrice = item.priceUSD && exchangeRate
                ? item.priceUSD * exchangeRate
                : (item.priceTRY ?? item.price ?? 0);

              // Calculate separate savings for bulk and VIP discounts
              const bulkSavings = item.packageInfo
                ? (basePrice - bulkEffectivePrice) * totalItemCount
                : (basePrice - bulkEffectivePrice) * item.quantity;
              const vipSavings = vipDiscount > 0
                ? (item.packageInfo ? bulkEffectivePrice * (vipDiscount / 100) * totalItemCount : bulkEffectivePrice * (vipDiscount / 100) * item.quantity)
                : 0;

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
                        <div className="relative h-16 w-16 flex-shrink-0">
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            sizes="64px"
                            className="object-cover rounded-lg border border-slate-100 bg-slate-50"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-300">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        {exchangeRate ? formatDualPrice(item.priceUSD, exchangeRate, false, 1, effectivePrice) : "₺" + effectivePrice.toLocaleString("tr-TR")}
                        <span className="text-xs font-normal text-slate-500">+KDV</span>
                        {effectivePrice < basePrice && basePrice > 0 && (
                          <span className="ml-2 text-xs text-green-600 line-through">
                            {exchangeRate ? formatDualPrice(item.priceUSD, exchangeRate, false, 1, basePrice) : "₺" + basePrice.toLocaleString("tr-TR")}
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
                          {exchangeRate ? formatDualPrice(item.priceUSD, exchangeRate, false, 1, effectivePrice * item.packageInfo.itemsPerBox) : "₺" + (effectivePrice * item.packageInfo.itemsPerBox).toLocaleString("tr-TR")}
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
                      {bulkSavings > 0 && ` - ${exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, bulkSavings) : "₺" + bulkSavings.toLocaleString("tr-TR")} tasarruf`}
                    </div>
                  )}

                  {vipStatus && vipDiscount > 0 && vipStatus.tier && (
                    <div className="rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-700">
                      💎 {vipStatus.tier.charAt(0).toUpperCase() + vipStatus.tier.slice(1)} VIP indirimi (%{vipDiscount}) uygulandı!
                      {vipSavings > 0 && ` - ${exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, vipSavings) : "₺" + vipSavings.toLocaleString("tr-TR")} ek tasarruf`}
                    </div>
                  )}

                  {nextTier && (
                    <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      💡 {nextTier.minQty - item.quantity} {item.packageInfo?.boxLabel.toLowerCase() || 'adet'} daha ekleyin,
                      birim fiyat {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, (nextTier.price * exchangeRate) * (1 - vipDiscount / 100)) : "₺" + ((nextTier.price * exchangeRate) * (1 - vipDiscount / 100)).toLocaleString("tr-TR")} +KDV olsun!
                    </div>
                  )}

                  {(() => {
                    const itemComboQty = getItemComboQuantity(item.id);
                    const totalItemQty = getTotalItemCount(item);

                    if (itemComboQty > 0) {
                      return (
                        <div className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-700">
                          🔄 <span className="font-semibold">Kombo İndirimi!</span>{' '}
                          {itemComboQty === totalItemQty ? (
                            <>Tüm ürünler ({itemComboQty.toLocaleString('tr-TR')} adet) için {comboDiscountLabel} indirim</>
                          ) : (
                            <>{totalItemQty.toLocaleString('tr-TR')} adetten {itemComboQty.toLocaleString('tr-TR')} adedi için {comboDiscountLabel} indirim</>
                          )}
                          {item.neckSize && ` (${item.neckSize})`}
                        </div>
                      );
                    }
                    return null;
                  })()}
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

          {items.length > 0 && (
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

                {/* Show original subtotal if there's a combo discount */}
                {comboDiscount > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <dt>Ürün Toplamı</dt>
                    <dd className="line-through">{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, vipSubtotal) : "₺" + vipSubtotal.toLocaleString("tr-TR")} <span className="text-xs font-normal">+KDV</span></dd>
                  </div>
                )}

                {comboDiscount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-purple-700 bg-purple-50 rounded-lg p-2 -mt-1">
                      <dt className="flex items-center gap-1 font-medium">
                        🔄 Kombo İndirimi
                        {comboDiscountLabel && (
                          <span className="rounded-full bg-purple-200 px-2 py-0.5 text-xs font-semibold">{comboDiscountLabel}</span>
                        )}
                      </dt>
                      <dd className="font-bold">
                        - {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, comboDiscount) : "₺" + comboDiscount.toLocaleString("tr-TR")}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs text-purple-800 -mt-1">
                      <p className="font-semibold mb-2">🎉 Kombo İndirimi Uygulandı!</p>
                      {comboMatches.map((match, idx) => {
                        // Get combo items with their quantities
                        const comboItems = match.itemComboQuantities
                          ? Object.entries(match.itemComboQuantities)
                              .map(([itemId, qty]) => {
                                const item = items.find(i => i.id === itemId);
                                return item ? { item, qty } : null;
                              })
                              .filter(Boolean)
                          : [];

                        return (
                          <div key={idx} className="mt-2 pt-2 border-t border-purple-200 first:border-t-0 first:pt-0">
                            <p className="font-semibold">
                              {match.matchedQuantity.toLocaleString('tr-TR')} adet {match.type1.toUpperCase()} + {match.type2.toUpperCase()}
                              {match.neckSize && ` (${match.neckSize})`}
                            </p>
                            {comboItems.length > 0 && (
                              <ul className="mt-1 ml-3 space-y-0.5 text-[11px]">
                                {comboItems.map(({ item, qty }) => (
                                  <li key={item.id} className="text-purple-700">
                                    • {item.title}: {qty.toLocaleString('tr-TR')} adet
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <dt>Ara Toplam (KDV Hariç)</dt>
                  <dd className="text-amber-700">{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, vipSubtotal - comboDiscount) : "₺" + (vipSubtotal - comboDiscount).toLocaleString("tr-TR")} <span className="text-xs font-normal text-slate-500">+KDV</span></dd>
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

                <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-amber-100">
                  <dt>KDV (%20)</dt>
                  <dd>{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, (vipSubtotal - comboDiscount) * 0.20) : "₺" + ((vipSubtotal - comboDiscount) * 0.20).toLocaleString("tr-TR")}</dd>
                </div>
              </dl>
              <div className="mt-6 border-t border-amber-100 pt-4">
                <div className="flex items-center justify-between text-base font-bold text-amber-700">
                  <span>Genel Toplam (KDV Dahil)</span>
                  <span>{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, ((vipSubtotal - comboDiscount) * 1.20) + (totalItems >= 50000 ? 0 : totalBoxes * 120)) : "₺" + (((vipSubtotal - comboDiscount) * 1.20) + (totalItems >= 50000 ? 0 : totalBoxes * 120)).toLocaleString("tr-TR")}</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  KDV hariç: {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, (vipSubtotal - comboDiscount) + (totalItems >= 50000 ? 0 : totalBoxes * 120)) : "₺" + ((vipSubtotal - comboDiscount) + (totalItems >= 50000 ? 0 : totalBoxes * 120)).toLocaleString("tr-TR")} +KDV
                </p>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  onClick={handleExportPDF}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF İndir
                </button>
                <button
                  onClick={() => setShowSampleModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Numune Talebi
                </button>
                <button
                  onClick={() => setShowQuoteModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Teklif Al
                </button>
                <Link
                  href="/checkout"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/30 transition hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Alışverişi Tamamla
                </Link>
              </div>
            </aside>
          )}
        </div>

        {/* Quote Modal */}
        {showQuoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Teklif Talebi</h2>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                  disabled={quoteLoading}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {quoteSuccess ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-900">Teklif Talebiniz Alındı!</h3>
                  <p className="mt-2 text-sm text-green-700">
                    En kısa sürede size dönüş yapacağız.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleQuoteSubmit}>
                  <div className="text-sm text-slate-600 mb-4">
                    Sepetinizdeki ürünler için teklif alabilirsiniz. Firma bilgilerinizi ve ödeme şartlarınızı belirtin.
                  </div>

                  {quoteError && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                      {quoteError}
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3">Firma Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Ad Soyad <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={quoteForm.name}
                          onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="Adınız ve soyadınız"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Firma Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={quoteForm.company}
                          onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="Firma adınız"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          E-posta <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={quoteForm.email}
                          onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="ornek@firma.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Telefon <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={quoteForm.phone}
                          onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="0555 123 45 67"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Vergi No
                        </label>
                        <input
                          type="text"
                          value={quoteForm.taxNumber}
                          onChange={(e) => setQuoteForm({ ...quoteForm, taxNumber: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Şehir <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={quoteForm.city}
                          onChange={(e) => setQuoteForm({ ...quoteForm, city: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="İstanbul"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Adres <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={quoteForm.address}
                        onChange={(e) => setQuoteForm({ ...quoteForm, address: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        placeholder="Tam adresiniz"
                      />
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div className="mb-6 rounded-lg bg-purple-50 border border-purple-200 p-4">
                    <h3 className="font-semibold text-purple-900 mb-3">Ödeme Şartları</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Vade Süresi <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={quoteForm.termMonths}
                          onChange={(e) => setQuoteForm({ ...quoteForm, termMonths: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        >
                          <option value="1">1 Ay</option>
                          <option value="2">2 Ay</option>
                          <option value="3">3 Ay</option>
                          <option value="4">4 Ay</option>
                          <option value="5">5 Ay</option>
                          <option value="6">6 Ay</option>
                          <option value="9">9 Ay</option>
                          <option value="12">12 Ay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Teminat Türü <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="guaranteeType"
                              value="check"
                              checked={quoteForm.guaranteeType === "check"}
                              onChange={() => setQuoteForm({ ...quoteForm, guaranteeType: "check" })}
                              className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-slate-700">Çek</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="guaranteeType"
                              value="teminat"
                              checked={quoteForm.guaranteeType === "teminat"}
                              onChange={() => setQuoteForm({ ...quoteForm, guaranteeType: "teminat" })}
                              className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-slate-700">Teminat Mektubu</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="guaranteeType"
                              value="açık"
                              checked={quoteForm.guaranteeType === "açık"}
                              onChange={() => setQuoteForm({ ...quoteForm, guaranteeType: "açık" })}
                              className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-slate-700">Açık Hesap</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Teminat Detayları
                        </label>
                        <textarea
                          value={quoteForm.guaranteeDetails}
                          onChange={(e) => setQuoteForm({ ...quoteForm, guaranteeDetails: e.target.value })}
                          rows={2}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          placeholder="Ek bilgiler varsa belirtiniz"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cart Summary */}
                  <div className="mb-6 rounded-lg bg-slate-50 border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Sipariş Özeti</h3>

                    {/* Products List */}
                    <div className="space-y-2 mb-4">
                      {items.map((item) => {
                        const effectivePrice = getEffectivePrice(item);
                        const totalItemCount = getTotalItemCount(item);
                        const itemTotal = calculateItemTotal(item);

                        return (
                          <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-200 last:border-0">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-500">
                                {item.packageInfo ? (
                                  <>
                                    {item.quantity} {item.packageInfo.boxLabel.toLowerCase()} × {item.packageInfo.itemsPerBox} = {totalItemCount.toLocaleString('tr-TR')} adet
                                  </>
                                ) : (
                                  <>{item.quantity} adet</>
                                )}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-slate-900">
                                {exchangeRate ? formatDualPrice(item.priceUSD, exchangeRate, false, 1, effectivePrice) : "₺" + effectivePrice.toLocaleString("tr-TR")}
                                <span className="text-xs font-normal text-slate-500"> /adet</span>
                              </p>
                              <p className="text-xs text-slate-600">
                                Toplam: {exchangeRate ? formatDualPrice(item.priceUSD, exchangeRate, false, totalItemCount, itemTotal) : "₺" + itemTotal.toLocaleString("tr-TR")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Totals */}
                    <div className="space-y-2 pt-3 border-t border-slate-300">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Ara toplam (KDV Hariç)</span>
                        <span className="font-semibold text-slate-900">
                          {exchangeRate ? formatDualPrice(undefined, exchangeRate, false, 1, subtotal) : "₺" + subtotal.toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">KDV (%20)</span>
                        <span className="font-semibold text-slate-900">
                          {exchangeRate ? formatDualPrice(undefined, exchangeRate, false, 1, subtotal * 0.20) : "₺" + (subtotal * 0.20).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Kargo</span>
                        <span className="font-semibold text-slate-900">
                          {totalBoxes >= 50 ? (
                            <span className="text-green-600">Ücretsiz</span>
                          ) : (
                            exchangeRate ? formatDualPrice(undefined, exchangeRate, false, 1, totalBoxes * 120) : "₺" + (totalBoxes * 120).toLocaleString("tr-TR")
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-300">
                        <span className="text-slate-900">Genel Toplam (KDV Dahil)</span>
                        <span className="text-purple-600">
                          {exchangeRate ? formatDualPrice(undefined, exchangeRate, false, 1, subtotal * 1.20 + (totalBoxes >= 50 ? 0 : totalBoxes * 120)) : "₺" + (subtotal * 1.20 + (totalBoxes >= 50 ? 0 : totalBoxes * 120)).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Notice */}
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Fiyat Bilgilendirmesi</p>
                        <p>
                          Yukarıda belirtilen fiyatlar <strong>peşin ödeme</strong> fiyatlarıdır.
                          Seçtiğiniz vade süresine göre nihai fiyatlarda değişiklik olabilir.
                          Size özel teklifimiz e-posta ile iletilecektir.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notlar
                    </label>
                    <textarea
                      value={quoteForm.notes}
                      onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                      placeholder="Eklemek istediğiniz notlar..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowQuoteModal(false)}
                      disabled={quoteLoading}
                      className="rounded-lg border border-slate-300 px-6 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={quoteLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                      {quoteLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Gönderiliyor...
                        </>
                      ) : (
                        "Teklif Gönder"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Sample Modal */}
        {showSampleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Numune Talebi</h2>
                <button
                  onClick={() => setShowSampleModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                  disabled={sampleLoading}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {sampleSuccess ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-900">Numune Talebiniz Alındı!</h3>
                  <p className="mt-2 text-sm text-green-700">
                    Numuneleriniz en kısa sürede kargoya verilecektir.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSampleSubmit}>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                    <p className="font-semibold text-blue-900">Numune Bilgileri</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Sepetinizdeki her üründen <span className="font-semibold">2 adet</span> numune gönderilecektir.
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Kargo Ücreti: <span className="font-semibold">200 TL (KDV Dahil)</span>
                    </p>
                  </div>

                  {sampleError && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                      {sampleError}
                    </div>
                  )}

                  {/* Product List */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Numune Ürünler:</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <span className="text-sm font-medium text-slate-900">{item.title}</span>
                          <span className="text-sm font-semibold text-blue-600">2 adet</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3">İletişim Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Ad Soyad <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={sampleForm.name}
                          onChange={(e) => setSampleForm({ ...sampleForm, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="Adınız ve soyadınız"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Firma Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={sampleForm.company}
                          onChange={(e) => setSampleForm({ ...sampleForm, company: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="Firma adınız"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          E-posta <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={sampleForm.email}
                          onChange={(e) => setSampleForm({ ...sampleForm, email: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="ornek@firma.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Telefon <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={sampleForm.phone}
                          onChange={(e) => setSampleForm({ ...sampleForm, phone: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="0555 123 45 67"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notlar
                    </label>
                    <textarea
                      value={sampleForm.notes}
                      onChange={(e) => setSampleForm({ ...sampleForm, notes: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Eklemek istediğiniz notlar..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowSampleModal(false)}
                      disabled={sampleLoading}
                      className="rounded-lg border border-slate-300 px-6 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={sampleLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sampleLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Gönderiliyor...
                        </>
                      ) : (
                        "Numune Talep Et"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
