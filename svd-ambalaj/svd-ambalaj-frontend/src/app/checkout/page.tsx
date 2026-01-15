"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getCurrentRate, formatDualPrice } from "@/lib/currency";
import { getThumbnailUrl } from "@/lib/image-utils";

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

  // Agreement checkboxes
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

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
      setCouponError("Lutfen bir kupon kodu girin");
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
        setCouponError(result.error || "Gecersiz kupon kodu");
      }
    } catch (error) {
      console.error("Coupon validation failed:", error);
      setCouponError("Kupon kodu dogrulanamadi");
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

  // Calculate totals with coupon and shipping
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const totalDiscount = (comboDiscount || 0) + couponDiscount;
  const subtotalAfterDiscounts = subtotal - totalDiscount;
  const taxAmount = subtotalAfterDiscounts * (taxRate / 100);
  // Shipping: free if 50000+ items, otherwise 120 TL per box
  const shippingCost = totalItems >= 50000 ? 0 : totalBoxes * 120;
  const shippingTax = shippingCost * (taxRate / 100);
  const grandTotal = subtotalAfterDiscounts + taxAmount + shippingCost + shippingTax;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) {
      setStatus("error");
      setMessage("Sepetiniz bos. Lutfen urun ekleyin.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const payload = {
      customer: {
        ...form,
        userId: user?.uid || null,
      },
      items: items.map((item) => {
        const effectivePrice = getEffectivePrice(item);
        const totalItemCount = getTotalItemCount(item);
        const itemSubtotal = calculateItemTotal(item);

        return {
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: effectivePrice,
          priceUSD: item.priceUSD || null,
          subtotal: itemSubtotal,
          category: item.slug?.split('-')[0] || null,
          packageInfo: item.packageInfo || null,
          totalItemCount,
          imageUrl: item.images?.[0] || null,
        };
      }),
      totals: {
        subtotal,
        comboDiscount: comboDiscount || 0,
        couponDiscount: couponDiscount,
        totalDiscount: totalDiscount,
        shipping: shippingCost + shippingTax,
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
      status: paymentMethod === "credit_card" ? "pending_payment" : "pending",
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
        }
      }

      // If credit card payment, redirect to PayTR
      if (paymentMethod === "credit_card" && paymentSettings?.paytrEnabled) {
        setProcessingPayment(true);
        try {
          const totalAmount = grandTotal;
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
              cart_items: items.map((item) => ({
                name: item.title,
                price: calculateItemTotal(item),
                quantity: 1,
              })),
              total_amount: totalAmount,
            }),
          });

          if (!paymentResponse.ok) {
            throw new Error("Payment token creation failed");
          }

          const paymentResult = await paymentResponse.json();

          if (paymentResult.success && paymentResult.token) {
            router.push(`/checkout/payment?token=${paymentResult.token}&orderId=${orderId}`);
            return;
          } else {
            throw new Error(paymentResult.error || "Odeme baslatilamadi");
          }
        } catch (paymentError) {
          console.error("Payment initialization failed:", paymentError);
          setStatus("error");
          setMessage("Odeme baslatilirken bir hata olustu. Lutfen tekrar deneyin veya farkli bir odeme yontemi secin.");
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
      setMessage("Siparis olusturulurken bir hata olustu. Lutfen daha sonra tekrar deneyin.");
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
              {authLoading ? "Yukleniyor..." : "Giris sayfasina yonlendiriliyorsunuz..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 lg:py-12 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-amber-600 transition-colors">Ana Sayfa</Link>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/cart" className="hover:text-amber-600 transition-colors">Sepet</Link>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-slate-900">Odeme</span>
        </nav>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-0">
            {/* Step 1: Cart - Completed */}
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="ml-2 text-sm font-medium text-green-700 hidden sm:inline">Sepet</span>
            </div>
            <div className="mx-2 sm:mx-4 h-0.5 w-8 sm:w-16 bg-green-500" />

            {/* Step 2: Checkout - Active */}
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 text-amber-600 ring-4 ring-amber-100 shadow-md">
                <span className="text-sm font-bold">2</span>
              </div>
              <span className="ml-2 text-sm font-semibold text-amber-700 hidden sm:inline">Bilgiler</span>
            </div>
            <div className="mx-2 sm:mx-4 h-0.5 w-8 sm:w-16 bg-slate-200" />

            {/* Step 3: Confirmation - Pending */}
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400 shadow-sm">
                <span className="text-sm font-medium">3</span>
              </div>
              <span className="ml-2 text-sm font-medium text-slate-400 hidden sm:inline">Onay</span>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Siparis Tamamla</h1>
          <p className="mt-2 text-slate-600">Fatura ve teslimat bilgilerinizi girin</p>
        </div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_400px]">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Fatura Bilgileri Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Fatura Bilgileri</h2>
                    <p className="text-sm text-slate-500">Kurumsal fatura detaylariniz</p>
                  </div>
                </div>

                {profileDataLoaded && (form.company || form.taxNumber) && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Bilgileriniz otomatik dolduruldu</p>
                      <p className="mt-0.5 text-sm text-green-700">Profilinizdeki bilgiler kullanildi. Gerekirse duzenleyebilirsiniz.</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="company" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Firma Adi
                      {profileDataLoaded && form.company && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Profilden</span>
                      )}
                    </label>
                    <input
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 hover:border-slate-300"
                      placeholder="Firma adinizi girin"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="taxNumber" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Vergi No / T.C.
                      {profileDataLoaded && form.taxNumber && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Profilden</span>
                      )}
                    </label>
                    <input
                      id="taxNumber"
                      name="taxNumber"
                      value={form.taxNumber}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 hover:border-slate-300"
                      placeholder="Vergi numaranizi girin"
                    />
                  </div>
                </div>
              </div>

              {/* Teslimat Adresi Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Teslimat Adresi</h2>
                    <p className="text-sm text-slate-500">Siparisinizin gonderilecegi adres</p>
                  </div>
                </div>

                {/* Saved Address Cards */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleAddressSelect(addr.id)}
                        className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                          selectedAddressId === addr.id && !useNewAddress
                            ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        {addr.isDefault && (
                          <span className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                            Varsayilan
                          </span>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            selectedAddressId === addr.id && !useNewAddress
                              ? "bg-amber-500 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900">{addr.title}</p>
                            <p className="text-sm text-slate-600 truncate">{addr.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{addr.city}, {addr.district}</p>
                          </div>
                          {selectedAddressId === addr.id && !useNewAddress && (
                            <svg className="h-5 w-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}

                    {/* New Address Card */}
                    <button
                      type="button"
                      onClick={() => handleAddressSelect("new")}
                      className={`rounded-xl border-2 border-dashed p-4 text-left transition-all ${
                        useNewAddress
                          ? "border-amber-500 bg-amber-50"
                          : "border-slate-300 hover:border-amber-400 hover:bg-amber-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 py-2">
                        <svg className={`h-5 w-5 ${useNewAddress ? "text-amber-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className={`font-medium ${useNewAddress ? "text-amber-700" : "text-slate-600"}`}>
                          Yeni Adres Ekle
                        </span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Selected Address Preview */}
                {selectedAddressId && !useNewAddress && (
                  <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <div className="text-sm">
                        <p className="font-semibold text-slate-800">{savedAddresses.find(a => a.id === selectedAddressId)?.fullName}</p>
                        <p className="text-slate-600">{savedAddresses.find(a => a.id === selectedAddressId)?.phone}</p>
                        <p className="text-slate-600 mt-1">{savedAddresses.find(a => a.id === selectedAddressId)?.address}</p>
                        <p className="text-slate-600">{savedAddresses.find(a => a.id === selectedAddressId)?.district} / {savedAddresses.find(a => a.id === selectedAddressId)?.city}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Address Form */}
                {(useNewAddress || savedAddresses.length === 0) && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Ad Soyad
                      </label>
                      <input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 hover:border-slate-300"
                        placeholder="Alici adi"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Telefon
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        pattern="^\+?\d{10,15}$"
                        title="Lutfen gecerli bir telefon numarasi girin"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 hover:border-slate-300"
                        placeholder="05XX XXX XX XX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Sehir
                      </label>
                      <input
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 hover:border-slate-300"
                        placeholder="Sehir"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Adres
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        rows={3}
                        value={form.address}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 hover:border-slate-300 resize-none"
                        placeholder="Sokak, mahalle, ilce ve posta kodu bilgilerini yaziniz"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Odeme Yontemi Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Odeme Yontemi</h2>
                    <p className="text-sm text-slate-500">Odeme tercihinizi secin</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Bank Transfer Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`group relative rounded-xl border-2 p-5 text-left transition-all ${
                      paymentMethod === "bank_transfer"
                        ? "border-amber-500 bg-gradient-to-br from-amber-50 to-white ring-2 ring-amber-200"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {paymentMethod === "bank_transfer" && (
                      <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl group-hover:bg-slate-200 transition-colors">
                      <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">Havale / EFT</h3>
                    <p className="mt-1 text-sm text-slate-600">Siparis onayindan sonra banka hesap bilgileri iletilecektir.</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Guvenli banka transferi
                    </div>
                  </button>

                  {/* Credit Card Option */}
                  {paymentSettings?.paytrEnabled && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("credit_card")}
                      className={`group relative rounded-xl border-2 p-5 text-left transition-all ${
                        paymentMethod === "credit_card"
                          ? "border-amber-500 bg-gradient-to-br from-amber-50 to-white ring-2 ring-amber-200"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      {paymentMethod === "credit_card" && (
                        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {paymentSettings.paytrTestMode && (
                        <span className="absolute top-3 left-3 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Test
                        </span>
                      )}
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl group-hover:bg-slate-200 transition-colors">
                        <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900">Kredi Karti</h3>
                      <p className="mt-1 text-sm text-slate-600">PayTR guvenli odeme altyapisi ile aninda odeme.</p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        3D Secure guvenli odeme
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Ek Notlar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Ek Notlar</h2>
                    <p className="text-sm text-slate-500">Ozel isteklerinizi belirtin (opsiyonel)</p>
                  </div>
                </div>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 hover:border-slate-300 resize-none"
                  placeholder="Teslimat, paketleme veya odeme tercihlerinizi belirtebilirsiniz."
                />
              </div>

              {/* Error Message */}
              {message && (
                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 px-5 py-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rose-100">
                    <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-rose-800">Hata Olustu</p>
                    <p className="text-sm text-rose-700">{message}</p>
                  </div>
                </div>
              )}

              {/* Sozlesme Onaylari */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Sozlesme Onaylari</h2>
                    <p className="text-sm text-slate-500">Devam etmek icin sozlesmeleri kabul edin</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    agreementAccepted
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreementAccepted}
                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        agreementAccepted
                          ? "border-green-500 bg-green-500"
                          : "border-slate-300 bg-white"
                      }`}>
                        {agreementAccepted && (
                          <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-700">
                      <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="text-amber-600 hover:text-amber-700 font-semibold underline decoration-amber-200 hover:decoration-amber-400 transition-colors">
                        Mesafeli Satis Sozlesmesi
                      </Link>
                      &apos;ni okudum ve kabul ediyorum.
                    </span>
                  </label>

                  <label className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    privacyAccepted
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        privacyAccepted
                          ? "border-green-500 bg-green-500"
                          : "border-slate-300 bg-white"
                      }`}>
                        {privacyAccepted && (
                          <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-700">
                      <Link href="/gizlilik-politikasi" target="_blank" className="text-amber-600 hover:text-amber-700 font-semibold underline decoration-amber-200 hover:decoration-amber-400 transition-colors">
                        Gizlilik Politikasi ve KVKK Aydinlatma Metni
                      </Link>
                      &apos;ni okudum ve kabul ediyorum.
                    </span>
                  </label>
                </div>
              </div>

              {/* Desktop Submit Button */}
              <button
                type="submit"
                disabled={status === "submitting" || processingPayment || !agreementAccepted || !privacyAccepted}
                className="hidden lg:flex group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:opacity-70 disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none items-center justify-center gap-3"
              >
                {status === "submitting" || processingPayment ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    <span>{processingPayment ? "Odeme sayfasina yonlendiriliyor..." : "Isleniyor..."}</span>
                  </>
                ) : !agreementAccepted || !privacyAccepted ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Sozlesmeleri Onaylayin</span>
                  </>
                ) : paymentMethod === "credit_card" ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Guvenli Odemeye Gec</span>
                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Siparis Talebini Gonder</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Order Summary Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:h-fit space-y-4">
            {/* Order Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Siparis Ozeti
                </h2>
                <p className="text-sm text-slate-300 mt-1">{items.length} urun</p>
              </div>

              {/* Product List with Thumbnails */}
              <div className="p-5">
                <ul className="space-y-4 max-h-64 overflow-y-auto">
                  {items.map((item) => {
                    const effectivePrice = getEffectivePrice(item);
                    const itemTotal = calculateItemTotal(item);
                    const totalItemCount = getTotalItemCount(item);

                    return (
                      <li key={item.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        {/* Product Thumbnail */}
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                          {item.images && item.images[0] ? (
                            <Image
                              src={getThumbnailUrl(item.images[0])}
                              alt={item.title}
                              fill
                              sizes="56px"
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                          {/* Quantity Badge */}
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white ring-2 ring-white">
                            {item.quantity}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm line-clamp-2">{item.title}</p>
                          {item.packageInfo && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.quantity} {item.packageInfo.boxLabel} x {item.packageInfo.itemsPerBox} = {totalItemCount.toLocaleString('tr-TR')} adet
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-400">
                              @{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, effectivePrice) : `$${effectivePrice.toFixed(2)}`}
                            </span>
                            <span className="text-sm font-semibold text-amber-600">
                              {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, itemTotal) : `$${itemTotal.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Kupon Kodu
              </h3>
              {appliedCoupon ? (
                <div className="rounded-xl bg-green-50 border border-green-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎟</span>
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
                      Kaldir
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
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {couponLoading ? "..." : "Uygula"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-2 text-xs text-red-600">{couponError}</p>
              )}
            </div>

            {/* Totals Section */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
              <div className="space-y-3 text-sm">
                {totalBoxes > 0 && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Toplam Koli</span>
                    <span className="font-semibold">{totalBoxes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-700">
                  <span>Toplam Urun</span>
                  <span className="font-semibold">{totalItems.toLocaleString('tr-TR')} adet</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Ara Toplam</span>
                  <span className="font-semibold">
                    {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, subtotal) : `$${subtotal.toFixed(2)}`}
                  </span>
                </div>
                {comboDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <span>🔄</span> Kombo Indirimi
                    </span>
                    <span className="font-semibold">
                      -{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, comboDiscount) : `$${comboDiscount.toFixed(2)}`}
                    </span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <span>🎟</span> Kupon ({appliedCoupon?.code})
                    </span>
                    <span className="font-semibold">
                      -{exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, couponDiscount) : `$${couponDiscount.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-500">
                  <span>KDV (%{taxRate})</span>
                  <span>
                    {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, taxAmount + shippingTax) : `$${(taxAmount + shippingTax).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1">
                    Kargo <span className="text-xs text-slate-400">(KDV hariç)</span>
                    {totalItems >= 50000 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Bedava</span>
                    )}
                  </span>
                  <span className="font-semibold">
                    {totalItems >= 50000 ? (
                      <span className="text-green-600">Ucretsiz</span>
                    ) : (
                      <>
                        {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, shippingCost) : `₺${shippingCost.toLocaleString('tr-TR')}`}
                      </>
                    )}
                  </span>
                </div>
                {totalItems < 50000 && totalItems > 0 && (
                  <div className="rounded-lg bg-amber-100/50 p-3 text-xs text-amber-800">
                    <p className="font-semibold">💡 Kargo Avantaji</p>
                    <p className="mt-1">
                      {(50000 - totalItems).toLocaleString('tr-TR')} adet daha siparis vererek <span className="font-semibold">ucretsiz kargo</span> kazanin!
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-amber-200 pt-3 text-lg font-bold text-amber-700">
                  <span>Genel Toplam</span>
                  <span>
                    {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, grandTotal) : `$${grandTotal.toFixed(2)}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-center">KDV dahil</p>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Toplam</p>
              <p className="text-lg font-bold text-amber-600">
                {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, grandTotal) : `$${grandTotal.toFixed(2)}`}
              </p>
            </div>
            <button
              type="submit"
              form="checkout-form"
              disabled={status === "submitting" || processingPayment || !agreementAccepted || !privacyAccepted}
              className="flex-1 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === "submitting" || processingPayment
                ? "Isleniyor..."
                : !agreementAccepted || !privacyAccepted
                ? "Onaylayin"
                : paymentMethod === "credit_card"
                ? "Odemeye Gec"
                : "Siparisi Gonder"}
            </button>
          </div>
        </div>

        {/* Spacer for mobile fixed bar */}
        <div className="h-24 lg:hidden" />
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
            <p className="mt-4 text-slate-600">Yukleniyor...</p>
          </div>
        </div>
      </main>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
