"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/admin-api";

interface SettingsResults {
  [key: string]: {
    section: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export default function InitializeSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SettingsResults | null>(null);

  const handleInitialize = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiFetch<{ settings: SettingsResults }>("/admin/settings/initialize", {
        method: "POST",
      });

      setResults(response.settings);
      setSuccess(true);

      // Redirect to settings page after 3 seconds
      setTimeout(() => {
        window.location.href = "/admin/settings";
      }, 3000);
    } catch (err) {
      console.error("Initialization failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Ayarlar başlatılırken bir hata oluştu";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-w-2xl mx-auto p-6">
          {!success ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">⚙️</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Ayarları Başlat
                </h1>
                <p className="text-slate-600">
                  Sistem ayarlarını varsayılan değerlerle başlatmak için aşağıdaki butona tıklayın.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Başlatılacak Ayarlar:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>💰 <strong>Fiyatlandırma:</strong> Para birimi, KDV oranı</li>
                  <li>🏢 <strong>Site Ayarları:</strong> Site adı, iletişim bilgileri</li>
                  <li>📧 <strong>E-posta:</strong> SMTP ayarları (boş)</li>
                  <li>💳 <strong>Ödeme:</strong> PayTR ayarları (boş)</li>
                  <li>🔍 <strong>SEO:</strong> Meta bilgiler</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">❌</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900">Hata</h3>
                      <p className="text-sm text-red-800 mt-1">{error}</p>
                      {error.includes("Super admin role required") && (
                        <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-900">
                          <p className="font-semibold mb-2">Önce Super Admin rolünü oluşturmalısınız:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Firebase Console &gt; Firestore Database&apos;i açın</li>
                            <li>&quot;adminRoles&quot; koleksiyonunu bulun veya oluşturun</li>
                            <li>Yeni doküman ekleyin (Document ID: Firebase Auth UID&apos;niz)</li>
                            <li>Alanlar: role: &quot;super_admin&quot;, permissions: {`{manageSettings: true, ...}`}</li>
                            <li>Sayfayı yenileyin ve tekrar deneyin</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleInitialize}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Başlatılıyor...
                    </span>
                  ) : (
                    "Ayarları Başlat"
                  )}
                </button>

                <a
                  href="/admin/settings"
                  className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  İptal
                </a>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Başarılı!
              </h2>
              <p className="text-slate-600 mb-6">
                Ayarlar başarıyla başlatıldı. Ayarlar sayfasına yönlendiriliyorsunuz...
              </p>

              {results && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">
                    Başlatılan Ayarlar:
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {Object.keys(results).map((section) => (
                      <li key={section} className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="capitalize">{section}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1 text-sm text-amber-800">
              <p className="font-semibold mb-1">Önemli Not:</p>
              <p>
                Bu işlem yalnızca ayarlar henüz oluşturulmamışsa yeni ayarlar ekler.
                Mevcut ayarlarınız varsa üzerine yazılmaz, korunur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
