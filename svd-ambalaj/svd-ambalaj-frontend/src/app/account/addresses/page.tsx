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

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        // TODO: Implement backend API call
        // const response = await fetch(`/api/addresses?userId=${user?.uid}`);
        // const data = await response.json();
        // setAddresses(data);
        
        // Temporary mock data
        setAddresses([
          {
            id: "1",
            title: "Ev Adresi",
            fullName: "Ahmet Yılmaz",
            phone: "+90 555 123 4567",
            address: "Atatürk Mahallesi, İnönü Caddesi No:45 Daire:5",
            city: "İstanbul",
            district: "Kadıköy",
            postalCode: "34710",
            isDefault: true
          },
          {
            id: "2",
            title: "İş Adresi",
            fullName: "Ahmet Yılmaz",
            phone: "+90 555 123 4567",
            address: "Büyükdere Caddesi, Tekstil Plaza Kat:8 No:102",
            city: "İstanbul",
            district: "Şişli",
            postalCode: "34394",
            isDefault: false
          }
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        setLoading(false);
      }
    };

    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const handleSetDefault = async (addressId: string) => {
    // TODO: Implement API call
    setAddresses(prevAddresses =>
      prevAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }))
    );
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) {
      return;
    }
    // TODO: Implement API call
    setAddresses(prevAddresses => 
      prevAddresses.filter(addr => addr.id !== addressId)
    );
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
              <form className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adres Başlığı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ev, İş, Depo"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    placeholder="+90 555 123 4567"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adres
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    İl
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    İlçe
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-amber-600 hover:to-amber-700"
                  >
                    Kaydet
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
