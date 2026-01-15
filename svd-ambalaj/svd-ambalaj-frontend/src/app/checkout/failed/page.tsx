"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");

  const getErrorMessage = () => {
    switch (reason) {
      case "timeout":
        return {
          title: "İşlem Zaman Aşımına Uğradı",
          description: "Ödeme işleminiz belirlenen süre içinde tamamlanamadı. Lütfen tekrar deneyiniz."
        };
      case "cancelled":
        return {
          title: "İşlem İptal Edildi",
          description: "Ödeme işleminizi iptal ettiniz. Dilediğiniz zaman tekrar deneyebilirsiniz."
        };
      default:
        return {
          title: "Ödeme Tamamlanamadı",
          description: "Ödeme işlemi sırasında bir sorun oluştu. Kart bilgilerinizi kontrol ederek tekrar deneyebilirsiniz."
        };
    }
  };

  const errorInfo = getErrorMessage();

  const possibleReasons = [
    { icon: "💳", text: "Yetersiz bakiye veya günlük limit aşımı" },
    { icon: "🔢", text: "Hatalı kart numarası, son kullanma tarihi veya CVV" },
    { icon: "🌐", text: "Kartın internet alışverişine kapalı olması" },
    { icon: "🔐", text: "3D Secure doğrulama başarısız olması" },
    { icon: "📱", text: "SMS onay kodunun hatalı girilmesi" }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 py-12 px-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg mx-auto relative">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-br from-rose-500 to-red-600 px-8 py-10 text-center">
            {/* Animated X Icon */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-12 h-12 text-rose-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-rose-100 text-sm max-w-xs mx-auto">
              {errorInfo.description}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Order ID Badge */}
            {orderId && (
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Sipariş Referansı</p>
                    <p className="font-mono text-sm font-semibold text-slate-700">{orderId}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <span className="text-lg">📋</span>
                  </div>
                </div>
              </div>
            )}

            {/* Possible Reasons Card */}
            <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Olası Nedenler</h3>
                  <p className="text-xs text-slate-500">Aşağıdaki durumları kontrol edin</p>
                </div>
              </div>
              <ul className="space-y-3">
                {possibleReasons.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <span className="text-sm text-slate-600">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tekrar Dene
              </Link>

              <Link
                href="/cart"
                className="flex items-center justify-center gap-2 w-full bg-white text-slate-700 py-4 px-6 rounded-xl font-semibold border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Sepete Dön
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full text-slate-500 py-3 px-6 rounded-xl font-medium hover:text-slate-700 hover:bg-slate-50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="mt-6 p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎧</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Yardıma mı İhtiyacınız Var?</h3>
              <p className="text-sm text-slate-500 mb-3">
                Sorun devam ederse müşteri hizmetlerimize ulaşın.
                {orderId && <span className="block text-xs mt-1">Referans: {orderId}</span>}
              </p>
              <a
                href="mailto:destek@svdambalaj.com"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                destek@svdambalaj.com
              </a>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Ödeme bilgileriniz güvende. Hiçbir kart bilgisi sistemimizde saklanmaz.
        </p>
      </div>
    </main>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Yükleniyor...</p>
        </div>
      </main>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
