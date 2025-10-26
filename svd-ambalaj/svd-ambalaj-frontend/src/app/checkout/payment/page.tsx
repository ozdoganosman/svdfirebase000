"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");

  useEffect(() => {
    // Get payment token from URL
    const token = searchParams.get("token");

    if (!token) {
      setError("Ödeme token'ı bulunamadı");
      setLoading(false);
      return;
    }

    // Construct PayTR iframe URL
    const iframe_url = `https://www.paytr.com/odeme/guvenli/${token}`;
    setIframeUrl(iframe_url);
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Ödeme sayfası hazırlanıyor...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Hata Oluştu</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/checkout")}
            className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-700 transition"
          >
            Sepete Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Güvenli Ödeme</h1>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>256-bit SSL ile şifrelendi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment iframe */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Info banner */}
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Güvenli Ödeme</h3>
                <p className="text-sm text-amber-800">
                  Ödemeniz PayTR güvenli ödeme altyapısı ile korunmaktadır.
                  Kart bilgileriniz hiçbir şekilde saklanmaz ve paylaşılmaz.
                </p>
              </div>
            </div>
          </div>

          {/* iframe container */}
          <div className="relative" style={{ minHeight: "600px" }}>
            {iframeUrl && (
              <iframe
                src={iframeUrl}
                id="paytriframe"
                frameBorder="0"
                scrolling="no"
                style={{
                  width: "100%",
                  height: "600px",
                  border: "none",
                }}
                title="PayTR Ödeme"
              />
            )}
          </div>

          {/* Support info */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  3D Secure
                </span>
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Tüm kartlar geçerli
                </span>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="text-sm text-slate-600 hover:text-slate-900 transition"
              >
                ← İptal Et ve Geri Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent"></div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
