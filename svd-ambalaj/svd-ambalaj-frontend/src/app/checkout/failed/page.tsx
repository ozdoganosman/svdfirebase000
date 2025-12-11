"use client";

import Link from "next/link";

export default function PaymentFailedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Ödeme Başarısız
        </h1>

        <p className="text-slate-600 mb-6">
          Ödeme işlemi tamamlanamadı. Kartınızın limitini, son kullanma tarihini
          ve CVV kodunu kontrol ederek tekrar deneyebilirsiniz.
        </p>

        <div className="space-y-3">
          <Link
            href="/checkout"
            className="block w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-600 transition"
          >
            Tekrar Dene
          </Link>

          <Link
            href="/cart"
            className="block w-full bg-slate-100 text-slate-700 py-3 px-6 rounded-lg font-semibold hover:bg-slate-200 transition"
          >
            Sepete Dön
          </Link>
        </div>

        <div className="mt-8 p-4 bg-slate-50 rounded-lg text-left">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Olası Nedenler:
          </h3>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Yetersiz bakiye veya limit</li>
            <li>Yanlış kart bilgileri</li>
            <li>Kartın internet alışverişine kapalı olması</li>
            <li>3D Secure doğrulama hatası</li>
          </ul>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Sorun devam ederse{" "}
          <a href="mailto:destek@svdambalaj.com" className="text-amber-600 hover:underline">
            destek@svdambalaj.com
          </a>{" "}
          adresinden bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </main>
  );
}
