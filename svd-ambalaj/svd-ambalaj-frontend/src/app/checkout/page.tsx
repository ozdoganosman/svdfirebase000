"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getCurrentRate, formatDualPrice } from "@/lib/currency";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/svdfirebase000/us-central1/api";

type CheckoutFormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  taxNumber: string;
  address: string;
  city: string;
  notes: string;
};

type PaymentMethod = "bank_transfer" | "credit_card";

type PaymentSettings = {
  paytrEnabled: boolean;
  paytrTestMode: boolean;
};

interface SavedAddress {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  isDefault: boolean;
}

const defaultState: CheckoutFormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  taxNumber: "",
  address: "",
  city: "",
  notes: "",
};

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const {
    items,
    subtotal,
    totalBoxes,
    totalItems,
    comboDiscount,
    comboMatches,
    taxRate,
    getEffectivePrice,
    getTotalItemCount,
    calculateItemTotal,
    clearCart
  } = useCart();
  const [form, setForm] = useState<CheckoutFormState>(defaultState);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Coupon code state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountAmount: number;
    discountType: "percentage" | "fixed";
    discountValue: number;
    message: string;
  } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    getCurrentRate().then(rate => setExchangeRate(rate.rate)).catch(() => setExchangeRate(null));
  }, []);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch(`${apiBase}/settings/payment/public`);
        if (response.ok) {
          const data = await response.json();
          setPaymentSettings({
            paytrEnabled: data.paytrEnabled ?? false,
            paytrTestMode: data.paytrTestMode ?? true,
          });
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error);
      }
    };
    fetchPaymentSettings();
  }, []);

  // Load quote data if fromQuote param exists
  useEffect(() => {
    const fromQuoteParam = searchParams.get("fromQuote");
    if (fromQuoteParam) {
      setQuoteId(fromQuoteParam);

      // Fetch quote data
      fetch(`${apiBase}/quotes/${fromQuoteParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.quote) {
            // Auto-fill customer info from quote
            setForm(prev => ({
              ...prev,
              name: data.quote.customer.name || prev.name,
              company: data.quote.customer.company || prev.company,
              email: data.quote.customer.email || prev.email,
              phone: data.quote.customer.phone || prev.phone,
              taxNumber: data.quote.customer.taxNumber || prev.taxNumber,
              address: data.quote.customer.address || prev.address,
              city: data.quote.customer.city || prev.city,
            }));

            setProfileDataLoaded(true); // Prevent profile fetch from overriding
          }
        })
        .catch(error => {
          console.error("Error loading quote:", error);
        });
    }
  }, [searchParams]);

  // Fetch user profile to auto-fill company info
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || profileDataLoaded) return;

      try {
        const response = await fetch(`${apiBase}/user/profile?userId=${user.uid}`);

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const data = await response.json();
        const profile = data.user;

        // Auto-fill company, email, and tax number if they exist in profile
        if (profile) {
          setForm(prev => ({
            ...prev,
            company: profile.company || prev.company,
            email: profile.email || prev.email,
            taxNumber: profile.taxNumber || prev.taxNumber,
          }));
          setProfileDataLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user, profileDataLoaded]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;

      try {
        const response = await fetch(`${apiBase}/user/addresses?userId=${user.uid}`);

        if (!response.ok) {
          throw new Error("Failed to fetch addresses");
        }

        const data = await response.json();
        const addresses = data.addresses || [];
        setSavedAddresses(addresses);

        // Auto-select default address
        const defaultAddr = addresses.find((a: SavedAddress) => a.isDefault);
        if (defaultAddr && !useNewAddress) {
          setSelectedAddressId(defaultAddr.id);
          setForm(prev => ({
            ...prev,
            name: defaultAddr.fullName,
            phone: defaultAddr.phone,
            address: `${defaultAddr.address}, ${defaultAddr.district}`,
            city: defaultAddr.city,
          }));
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    };

    fetchAddresses();
  }, [user, useNewAddress]);

  const handleAddressSelect = (addressId: string) => {
    if (addressId === "new") {
      setUseNewAddress(true);
      setSelectedAddressId("");
      setForm(prev => ({
        ...prev,
        name: "",
        phone: "",
        address: "",
        city: "",
      }));
    } else {
      setUseNewAddress(false);
      setSelectedAddressId(addressId);
      const selected = savedAddresses.find(a => a.id === addressId);
      if (selected) {
        setForm(prev => ({
          ...prev,
          name: selected.fullName,
          phone: selected.phone,
          address: `${selected.address}, ${selected.district}`,
          city: selected.city,
        }));
      }
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Apply coupon code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Lütfen bir kupon kodu girin");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await fetch(`${apiBase}/coupon/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.toUpperCase().trim(),
          orderTotal: subtotal - (comboDiscount || 0),
          userId: user?.uid || null,
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setAppliedCoupon({
          id: result.campaign.id,
          code: result.campaign.code,
          discountAmount: result.discountAmount,
          discountType: result.campaign.discountType,
          discountValue: result.campaign.discountValue,
          message: result.message,
        });
        setCouponCode("");
        setCouponError("");
      } else {
        setCouponError(result.error || "Geçersiz kupon kodu");
      }
    } catch (error) {
      console.error("Coupon validation failed:", error);
      setCouponError("Kupon kodu doğrulanamadı");
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Calculate totals with coupon
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const totalDiscount = (comboDiscount || 0) + couponDiscount;
  const subtotalAfterDiscounts = subtotal - totalDiscount;
  const taxAmount = subtotalAfterDiscounts * (taxRate / 100);
  const grandTotal = subtotalAfterDiscounts + taxAmount;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) {
      setStatus("error");
      setMessage("Sepetiniz boş. Lütfen ürün ekleyin.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const payload = {
      customer: {
        ...form,
        userId: user?.uid || null, // Add user ID if authenticated
      },
      items: items.map((item) => {
        const effectivePrice = getEffectivePrice(item);
        const totalItemCount = getTotalItemCount(item);
        const itemSubtotal = calculateItemTotal(item);

        return {
          id: item.id,
          title: item.title,
          quantity: item.quantity, // Box count (or item count if no packageInfo)
          price: effectivePrice, // Effective unit price in TRY (with bulk pricing applied)
          subtotal: itemSubtotal, // Total for this item (price * totalItemCount)
          category: item.slug?.split('-')[0] || null, // Extract category from slug
          packageInfo: item.packageInfo || null, // Include package info for statistics
          totalItemCount, // Actual item count (quantity * itemsPerBox if applicable)
        };
      }),
      totals: {
        subtotal,
        comboDiscount: comboDiscount || 0,
        couponDiscount: couponDiscount,
        totalDiscount: totalDiscount,
        finalTotal: subtotalAfterDiscounts,
        currency: "TRY",
      },
      comboMatches: comboMatches || [],
      coupon: appliedCoupon ? {
        campaignId: appliedCoupon.id,
        code: appliedCoupon.code,
        discountAmount: appliedCoupon.discountAmount,
        discountType: appliedCoupon.discountType,
        discountValue: appliedCoupon.discountValue,
      } : null,
      paymentMethod,
    };

    try {
      const response = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Order request failed");
      }

      const result = await response.json();
      const orderId = result?.order?.id;
      const orderNumber = result?.order?.orderNumber;

      // If this order is from a quote, mark quote as converted
      if (quoteId) {
        try {
          await fetch(`${apiBase}/quotes/${quoteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "converted" }),
          });
        } catch (quoteError) {
          console.error("Error updating quote status:", quoteError);
          // Don't fail the checkout if quote update fails
        }
      }

      // Record coupon usage if a coupon was applied
      if (appliedCoupon && orderId) {
        try {
          await fetch(`${apiBase}/coupon/use`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campaignId: appliedCoupon.id,
              userId: user?.uid || null,
              orderId: orderId,
            }),
          });
        } catch (couponError) {
          console.error("Error recording coupon usage:", couponError);
          // Don't fail the checkout if coupon recording fails
        }
      }

      // If credit card payment, redirect to PayTR
      if (paymentMethod === "credit_card" && paymentSettings?.paytrEnabled) {
        setProcessingPayment(true);
        try {
          const totalAmount = grandTotal; // Already includes all discounts and tax
          const paymentResponse = await fetch(`${apiBase}/payment/create-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              customer: {
                email: form.email,
                name: form.name,
                phone: form.phone,
                address: form.address,
              },
              // PayTR expects cart_items - send each item with its total price
              // Note: subtotal and calculateItemTotal are already in TRY
              cart_items: items.map((item) => ({
                name: item.title,
                price: calculateItemTotal(item), // Total price for this item in TRY
                quantity: 1, // Price already includes quantity calculation
              })),
              total_amount: totalAmount, // (subtotal - comboDiscount) * (1 + taxRate/100) in TRY
            }),
          });

          if (!paymentResponse.ok) {
            throw new Error("Payment token creation failed");
          }

          const paymentResult = await paymentResponse.json();

          if (paymentResult.success && paymentResult.token) {
            // Redirect to PayTR payment page
            router.push(`/checkout/payment?token=${paymentResult.token}`);
            return;
          } else {
            throw new Error(paymentResult.error || "Ödeme başlatılamadı");
          }
        } catch (paymentError) {
          console.error("Payment initialization failed:", paymentError);
          setStatus("error");
          setMessage("Ödeme başlatılırken bir hata oluştu. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi seçin.");
          setProcessingPayment(false);
          return;
        }
      }

      // For bank transfer, redirect to success page
      clearCart();
      setForm(defaultState);
      router.push(`/checkout/success?id=${orderId}&number=${orderNumber || orderId}&total=${grandTotal.toFixed(2)}`);
    } catch (error) {
      console.error("Order submission failed", error);
      setStatus("error");
      setMessage("Sipariş oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setStatus("idle");
    }
  };

  // Show loading or redirect if not authenticated
  if (authLoading || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">
              {authLoading ? "Yükleniyor..." : "Giriş sayfasına yönlendiriliyorsunuz..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
              Sipariş Tamamlama
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Fatura ve teslimat bilgilerinizi paylaşın</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Satış ekibimiz siparişinizi onaylamak ve ödeme seçeneklerini iletmek için en kısa sürede sizinle iletişime geçecek.
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600"
          >
            Sepete geri dön
          </Link>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60"
          >
            {/* Address Selector */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200">
                <label htmlFor="addressSelect" className="text-sm font-semibold text-slate-700">
                  Teslimat Adresi Seçin
                </label>
                <select
                  id="addressSelect"
                  value={useNewAddress ? "new" : selectedAddressId}
                  onChange={(e) => handleAddressSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  <option value="">Adres seçin...</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.title} - {addr.city}, {addr.district}
                    </option>
                  ))}
                  <option value="new">+ Yeni Adres Ekle</option>
                </select>
                {selectedAddressId && !useNewAddress && (
                  <div className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600 border border-slate-100">
                    <p className="font-semibold text-slate-800">
                      {savedAddresses.find(a => a.id === selectedAddressId)?.fullName}
                    </p>
                    <p>{savedAddresses.find(a => a.id === selectedAddressId)?.phone}</p>
                    <p>{savedAddresses.find(a => a.id === selectedAddressId)?.address}</p>
                    <p>
                      {savedAddresses.find(a => a.id === selectedAddressId)?.district} / 
                      {savedAddresses.find(a => a.id === selectedAddressId)?.city}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fatura Bilgileri - Always visible */}
            {profileDataLoaded && (form.company || form.email || form.taxNumber) && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Fatura bilgileriniz profilinizden otomatik dolduruldu.</span>
                </div>
                <p className="mt-1 ml-7 text-xs">Değişiklik yapabilir veya olduğu gibi bırakabilirsiniz.</p>
              </div>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Firma Adı
                  {profileDataLoaded && form.company && (
                    <span className="text-xs font-normal text-green-600">(Profilden)</span>
                  )}
                </label>
                <input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  E-posta
                  {profileDataLoaded && form.email && (
                    <span className="text-xs font-normal text-green-600">(Profilden)</span>
                  )}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="taxNumber" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Vergi No / T.C.
                  {profileDataLoaded && form.taxNumber && (
                    <span className="text-xs font-normal text-green-600">(Profilden)</span>
                  )}
                </label>
                <input
                  id="taxNumber"
                  name="taxNumber"
                  value={form.taxNumber}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
            </div>

            {/* Teslimat Bilgileri - Only when no saved address selected */}
            {(useNewAddress || !selectedAddressId) && (
              <>
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Teslimat Bilgileri
                  </h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      Ad Soyad
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      Telefon
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      pattern="^\+?\d{10,15}$"
                      title="Lütfen geçerli bir telefon numarası girin"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-semibold text-slate-700">
                      Şehir
                    </label>
                    <input
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-slate-700">
                    Teslimat Adresi
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={4}
                    value={form.address}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="Sokak, mahalle, ilçe ve posta kodu bilgilerini yazınız"
                  />
                </div>
              </>
            )}

            {/* Payment Method Selection */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Ödeme Yöntemi</h3>
              <div className="space-y-3">
                {/* Bank Transfer Option */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                    paymentMethod === "bank_transfer"
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                    className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏦</span>
                      <span className="font-semibold text-slate-900">Havale / EFT</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Sipariş onayından sonra banka hesap bilgileri iletilecektir.
                    </p>
                  </div>
                </label>

                {/* Credit Card Option - Only show if PayTR is enabled */}
                {paymentSettings?.paytrEnabled && (
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                      paymentMethod === "credit_card"
                        ? "border-amber-500 bg-amber-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={() => setPaymentMethod("credit_card")}
                      className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💳</span>
                        <span className="font-semibold text-slate-900">Kredi Kartı</span>
                        {paymentSettings.paytrTestMode && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Test Modu
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        PayTR güvenli ödeme altyapısı ile anında ödeme yapın.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-xs text-slate-500">3D Secure ile güvenli ödeme</span>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-semibold text-slate-700">
                Ek Notlar
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={form.notes}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="Teslimat, paketleme veya ödeme tercihlerinizi belirtebilirsiniz."
              />
            </div>

            {message && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting" || processingPayment}
              className="w-full rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" || processingPayment
                ? (processingPayment ? "Ödeme sayfasına yönlendiriliyor..." : "Gönderiliyor...")
                : paymentMethod === "credit_card"
                ? "Ödemeye Geç"
                : "Sipariş Talebini Gönder"}
            </button>
          </form>

          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-900">Sipariş Özeti</h2>
            <ul className="space-y-4 text-sm">
              {items.map((item) => {
                const effectivePrice = getEffectivePrice(item);
                const itemTotal = calculateItemTotal(item);
                const totalItemCount = getTotalItemCount(item);
                
                return (
                  <li key={item.id} className="space-y-2 border-b border-slate-100 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        {item.packageInfo && (
                          <p className="text-xs text-slate-500">
                            {item.quantity} {item.packageInfo.boxLabel} × {item.packageInfo.itemsPerBox} adet = {totalItemCount} adet
                          </p>
                        )}
                        {!item.packageInfo && (
                          <p className="text-xs text-slate-500">
                            {item.quantity} adet
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        Birim: {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, effectivePrice) : `$${effectivePrice.toFixed(2)}`}
                      </span>
                      <span className="font-bold text-amber-600">
                        {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, itemTotal) : `$${itemTotal.toFixed(2)}`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            
            {/* Coupon Code Section */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Kupon Kodu</h3>
              {appliedCoupon ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎟️</span>
                      <div>
                        <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                        <p className="text-xs text-green-600">{appliedCoupon.message}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    placeholder="Kupon kodu girin"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {couponLoading ? "..." : "Uygula"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-2 text-xs text-red-600">{couponError}</p>
              )}
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              {totalBoxes > 0 && (
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Toplam Koli</span>
                  <span className="font-semibold">{totalBoxes}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Toplam Ürün</span>
                <span className="font-semibold">{totalItems.toLocaleString('tr-TR')} adet</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Ara Toplam (KDV Hariç)</span>
                <span className="font-semibold">
                  {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, subtotal) : `$${subtotal.toFixed(2)}`}
                </span>
              </div>
              {comboDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>🔄 Kombo İndirimi ({comboMatches.length} eşleşme)</span>
                  <span className="font-semibold">
                    -{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, comboDiscount) : `$${comboDiscount.toFixed(2)}`}
                  </span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>🎟️ Kupon İndirimi ({appliedCoupon?.code})</span>
                  <span className="font-semibold">
                    -{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, couponDiscount) : `$${couponDiscount.toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>KDV (%{taxRate})</span>
                <span>
                  {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, taxAmount) : `$${taxAmount.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-amber-700">
                <span>Genel Toplam (KDV Dahil)</span>
                <span>
                  {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, grandTotal) : `$${grandTotal.toFixed(2)}`}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Kargo ve ödeme detayları satış ekibimiz tarafından onay sürecinde paylaşılacaktır.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Yükleniyor...</p>
          </div>
        </div>
      </main>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
