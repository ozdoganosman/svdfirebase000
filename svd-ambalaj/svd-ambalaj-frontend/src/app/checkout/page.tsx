"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    items, 
    subtotal,
    totalBoxes,
    totalItems,
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

  useEffect(() => {
    getCurrentRate().then(rate => setExchangeRate(rate.rate)).catch(() => setExchangeRate(null));
  }, []);

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
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price ?? 0,
        subtotal: (item.price ?? 0) * item.quantity,
      })),
      totals: {
        subtotal,
        currency: "TRY",
      },
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

      clearCart();
      setForm(defaultState);
      router.push(`/checkout/success?id=${orderId}&number=${orderNumber || orderId}`);
    } catch (error) {
      console.error("Order submission failed", error);
      setStatus("error");
      setMessage("Sipariş oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setStatus("idle");
    }
  };

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
              disabled={status === "submitting"}
              className="w-full rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? "Gönderiliyor..." : "Sipariş Talebini Gönder"}
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
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>KDV (%20)</span>
                <span>
                  {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, subtotal * 0.20) : `$${(subtotal * 0.20).toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-amber-700">
                <span>Genel Toplam (KDV Dahil)</span>
                <span>
                  {exchangeRate ? formatDualPrice(undefined, exchangeRate, true, 1, subtotal * 1.20) : `$${(subtotal * 1.20).toFixed(2)}`}
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
