"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/context/AuthContext";
import { VIPBadge, VIPProgress } from "@/components/VIPBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/svdfirebase000/us-central1/api";

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountPageContent />
    </AuthGuard>
  );
}

function AccountPageContent() {
  const { user, vipStatus, signOut } = useAuth();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [userProfile, setUserProfile] = useState({
    displayName: "",
    phone: "",
    company: "",
    taxNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setUserProfile({
        displayName: user.displayName || "",
        phone: "",
        company: "",
        taxNumber: "",
      });

      // Fetch full profile from backend
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${apiBase}/user/profile?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile({
          displayName: data.user.displayName || "",
          phone: data.user.phone || "",
          company: data.user.company || "",
          taxNumber: data.user.taxNumber || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const response = await fetch(`${apiBase}/user/profile?userId=${user.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Update display name in Firebase Auth
      await user.reload();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Profil güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Hesabım</h1>
            {vipStatus?.tier && <VIPBadge vipStatus={vipStatus} size="lg" />}
          </div>
          <p className="mt-2 text-slate-600">
            Hoş geldiniz, <span className="font-semibold">{user?.displayName || user?.email}</span>
          </p>
        </div>

        {/* VIP Progress */}
        {vipStatus && (
          <div className="mb-6">
            <VIPProgress vipStatus={vipStatus} />
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Profil Bilgileri</h2>
                <p className="text-sm text-slate-600">Kişisel bilgileriniz</p>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="rounded-lg bg-amber-500 p-2 text-white hover:bg-amber-600 transition"
                title="Profili Düzenle"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Ad Soyad</p>
                <p className="font-medium text-slate-900">{userProfile.displayName || "Belirtilmemiş"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">E-posta</p>
                <p className="font-medium text-slate-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Telefon</p>
                <p className="font-medium text-slate-900">{userProfile.phone || "Belirtilmemiş"}</p>
              </div>
              {userProfile.company && (
                <div>
                  <p className="text-sm text-slate-600">Şirket</p>
                  <p className="font-medium text-slate-900">{userProfile.company}</p>
                </div>
              )}
              {userProfile.taxNumber && (
                <div>
                  <p className="text-sm text-slate-600">Vergi No</p>
                  <p className="font-medium text-slate-900">{userProfile.taxNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Orders Card */}
          <Link
            href="/account/orders"
            className="group rounded-2xl bg-white p-6 shadow-lg border border-slate-200 hover:border-amber-500 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Siparişlerim</h2>
                <p className="text-sm text-slate-600">Sipariş geçmişinizi görüntüleyin</p>
              </div>
              <svg
                className="h-10 w-10 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-amber-600 group-hover:text-amber-700">
              Siparişleri görüntüle →
            </p>
          </Link>

          {/* Addresses Card */}
          <Link
            href="/account/addresses"
            className="group rounded-2xl bg-white p-6 shadow-lg border border-slate-200 hover:border-amber-500 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Adreslerim</h2>
                <p className="text-sm text-slate-600">Teslimat adreslerini yönetin</p>
              </div>
              <svg
                className="h-10 w-10 text-amber-600"
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
            </div>
            <p className="text-sm font-medium text-amber-600 group-hover:text-amber-700">
              Adresleri yönet →
            </p>
          </Link>

          {/* Quotes Card */}
          <Link
            href="/account/quotes"
            className="group rounded-2xl bg-white p-6 shadow-lg border border-slate-200 hover:border-purple-500 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tekliflerim</h2>
                <p className="text-sm text-slate-600">Teklif taleplerinizi görüntüleyin</p>
              </div>
              <svg
                className="h-10 w-10 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-purple-600 group-hover:text-purple-700">
              Teklifleri görüntüle →
            </p>
          </Link>

          {/* Samples Card */}
          <Link
            href="/account/samples"
            className="group rounded-2xl bg-white p-6 shadow-lg border border-slate-200 hover:border-blue-500 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Numunelerim</h2>
                <p className="text-sm text-slate-600">Numune taleplerinizi takip edin</p>
              </div>
              <svg
                className="h-10 w-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
              Numuneleri görüntüle →
            </p>
          </Link>

          {/* Settings Card */}
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Ayarlar</h2>
                <p className="text-sm text-slate-600">Hesap ayarları</p>
              </div>
              <svg
                className="h-10 w-10 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleSignOut}
                className="w-full text-left text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-8">
            {/* Header */}
            <div className="border-b border-slate-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Profil Ayarları</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Hesap bilgilerinizi düzenleyin ve güncelleyin
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="px-8 py-6">
              {/* Profile Picture Section */}
              <div className="mb-8 flex items-center gap-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border border-amber-100">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-3xl font-bold shadow-lg">
                  {userProfile.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{userProfile.displayName || "Kullanıcı"}</h4>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Hesap: {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("tr-TR") : "Bilinmiyor"}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Son giriş: {user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString("tr-TR") : "Bilinmiyor"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kişisel Bilgiler */}
              <div className="mb-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Kişisel Bilgiler
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={userProfile.displayName}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      E-posta <span className="text-slate-400 text-xs">(Değiştirilemez)</span>
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      placeholder="05xx xxx xx xx"
                    />
                  </div>
                </div>
              </div>

              {/* İşletme Bilgileri */}
              <div className="mb-6 rounded-xl bg-slate-50 p-6 border border-slate-200">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  İşletme Bilgileri
                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Opsiyonel</span>
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Şirket Adı
                    </label>
                    <input
                      type="text"
                      value={userProfile.company}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      placeholder="Şirket adınızı girin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Vergi Numarası
                    </label>
                    <input
                      type="text"
                      value={userProfile.taxNumber}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, taxNumber: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      placeholder="Vergi no / T.C. kimlik"
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Bu bilgiler fatura ve kurumsal işlemlerinizde kullanılacaktır.
                </p>
              </div>

              {/* Şifre Değiştirme */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="flex items-center gap-2 text-lg font-bold text-slate-900 hover:text-amber-600 transition"
                >
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Şifre Değiştir
                  <svg
                    className={`h-4 w-4 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showPasswordSection && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-6 border border-slate-200 space-y-4">
                    <p className="text-sm text-slate-600 mb-4">
                      Güvenlik nedeniyle şifrenizi değiştirmek için önce mevcut şifrenizi girmeniz gerekiyor.
                    </p>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Mevcut Şifre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Yeni Şifre <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          placeholder="••••••••"
                          minLength={6}
                        />
                        <p className="mt-1 text-xs text-slate-500">En az 6 karakter</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Yeni Şifre Tekrar <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {passwordError}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordSection(false);
                          setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                          setPasswordError("");
                        }}
                        className="rounded-lg border-2 border-slate-300 px-5 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          setPasswordError("");

                          if (!passwordForm.newPassword || !passwordForm.confirmPassword || !passwordForm.currentPassword) {
                            setPasswordError("Tüm alanları doldurun");
                            return;
                          }

                          if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                            setPasswordError("Yeni şifreler eşleşmiyor");
                            return;
                          }

                          if (passwordForm.newPassword.length < 6) {
                            setPasswordError("Yeni şifre en az 6 karakter olmalı");
                            return;
                          }

                          setLoading(true);
                          try {
                            const { changePassword } = await import("@/lib/firebase-auth");
                            await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
                            setPasswordForm({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                            setShowPasswordSection(false);
                            alert("Şifreniz başarıyla değiştirildi!");
                          } catch (error: unknown) {
                            console.error("[handlePasswordChange] Error changing password:", error);
                            if (error instanceof Error) {
                              console.error("[handlePasswordChange] Error message:", error.message);
                              const firebaseError = error as { code?: string; message: string };
                              console.error("[handlePasswordChange] Error code:", firebaseError.code);

                              const errorCode = firebaseError.code || "";
                              const errorMessage = error.message || "";

                              if (errorCode === "auth/wrong-password" || errorCode === "auth/invalid-credential" ||
                                  errorMessage.includes("wrong-password") || errorMessage.includes("invalid-credential")) {
                                setPasswordError("Mevcut şifre hatalı");
                              } else if (errorCode === "auth/requires-recent-login") {
                                setPasswordError("Güvenlik nedeniyle lütfen çıkış yapıp tekrar giriş yapın");
                              } else if (errorCode === "auth/weak-password") {
                                setPasswordError("Yeni şifre çok zayıf");
                              } else {
                                setPasswordError("Şifre değiştirme başarısız. Lütfen tekrar deneyin");
                              }
                            } else {
                              setPasswordError("Şifre değiştirme başarısız. Lütfen tekrar deneyin");
                            }
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2 font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Değiştiriliyor...
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Şifreyi Değiştir
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
