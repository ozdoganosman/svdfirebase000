"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/auth-guard";

interface Address {
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

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/svdfirebase000/us-central1/api";

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiBase}/user/addresses?userId=${user.uid}`);

        if (!response.ok) {
          throw new Error("Failed to fetch addresses");
        }

        const data = await response.json();
        setAddresses(data.addresses || []);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        `${apiBase}/user/addresses/${addressId}/set-default?userId=${user.uid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set default address");
      }

      // Update local state
      setAddresses(prevAddresses =>
        prevAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      );
    } catch (error) {
      console.error("Error setting default address:", error);
      alert("Varsayılan adres ayarlanamadı. Lütfen tekrar deneyin.");
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!user) return;

    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(
        `${apiBase}/user/addresses/${addressId}?userId=${user.uid}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete address");
      }

      // Update local state
      setAddresses(prevAddresses =>
        prevAddresses.filter(addr => addr.id !== addressId)
      );
    } catch (error) {
      console.error("Error deleting address:", error);
      alert("Adres silinemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${apiBase}/user/addresses?userId=${user.uid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create address");
      }

      const data = await response.json();

      // Add new address to local state
      setAddresses(prev => [data.address, ...prev]);

      // Reset form and close
      setFormData({
        title: "",
        fullName: "",
        phone: "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
        isDefault: false,
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error creating address:", error);
      alert("Adres eklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link
                href="/account"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 mb-4"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Hesabıma Dön
              </Link>
              <h1 className="text-3xl font-bold text-slate-800">Adreslerim</h1>
              <p className="text-slate-600 mt-2">
                Teslimat adreslerinizi yönetin
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-amber-700"
            >
              + Yeni Adres
            </button>
          </div>

          {/* Add Address Form */}
          {showForm && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Yeni Adres Ekle
              </h3>
              <form onSubmit={handleFormSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adres Başlığı
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Örn: Ev, İş, Depo"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="+90 555 123 4567"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adres
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    İl
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    İlçe
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleFormChange}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">Varsayılan adres olarak ayarla</span>
                  </label>
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">
                Henüz kayıtlı adresiniz yok
              </h3>
              <p className="mt-2 text-slate-600">
                Teslimat için bir adres ekleyin
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-amber-700"
              >
                Adres Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {address.title}
                        </h3>
                        {address.isDefault && (
                          <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Varsayılan
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">{address.fullName}</p>
                        <p>{address.phone}</p>
                        <p>{address.address}</p>
                        <p>
                          {address.district} / {address.city} - {address.postalCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="rounded-lg border border-amber-500 bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                        >
                          Varsayılan Yap
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
