"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountPageContent />
    </AuthGuard>
  );
}

function AccountPageContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Hesabım</h1>
          <p className="mt-2 text-slate-600">
            Hoş geldiniz, <span className="font-semibold">{user?.displayName || user?.email}</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Profil Bilgileri</h2>
                <p className="text-sm text-slate-600">Kişisel bilgileriniz</p>
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Ad Soyad</p>
                <p className="font-medium text-slate-900">{user?.displayName || "Belirtilmemiş"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">E-posta</p>
                <p className="font-medium text-slate-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Hesap Oluşturma</p>
                <p className="font-medium text-slate-900">
                  {user?.metadata.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString("tr-TR")
                    : "Bilinmiyor"}
                </p>
              </div>
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
              <button className="w-full text-left text-sm font-medium text-slate-700 hover:text-amber-600 transition">
                Şifre Değiştir
              </button>
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
    </main>
  );
}
