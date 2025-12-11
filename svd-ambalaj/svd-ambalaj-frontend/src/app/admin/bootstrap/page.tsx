"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/admin-api";

export default function BootstrapPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBootstrap = async () => {
    if (!user) {
      setError("Önce giriş yapmalısınız");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<{ success: boolean; message: string }>("/admin/bootstrap", {
        method: "POST",
      });

      if (response.success) {
        setSuccess(true);
        // Redirect to admin panel after 2 seconds
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
      }
    } catch (err) {
      console.error("Bootstrap failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Bootstrap işlemi başarısız";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Giriş Gerekli</h1>
          <p className="text-slate-600 mb-4">
            Admin yetkisi almak için önce giriş yapmalısınız.
          </p>
          <a
            href="/auth/login?redirect=/admin/bootstrap"
            className="inline-block bg-indigo-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-indigo-700"
          >
            Giriş Yap
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        {!success ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👑</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                İlk Admin Oluşturma
              </h1>
              <p className="text-slate-600">
                Sistemde henüz admin yoksa, bu hesabı super admin olarak ayarlayın.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Giriş Yapan Kullanıcı:</h3>
              <p className="text-sm text-blue-800">
                <strong>E-posta:</strong> {user.email}
              </p>
              <p className="text-sm text-blue-800">
                <strong>UID:</strong> {user.uid}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-xl">❌</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900">Hata</h3>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleBootstrap}
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  İşleniyor...
                </span>
              ) : (
                "Super Admin Olarak Ayarla"
              )}
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              Bu işlem sadece sistemde hiç admin yoksa çalışır.
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Başarılı!
            </h2>
            <p className="text-slate-600 mb-4">
              Super admin yetkisi verildi. Admin paneline yönlendiriliyorsunuz...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
