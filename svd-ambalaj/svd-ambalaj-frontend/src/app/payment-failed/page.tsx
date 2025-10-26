"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Error icon */}
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-4">
          Ödeme Başarısız
        </h1>

        {/* Message */}
        <p className="text-lg text-slate-600 text-center mb-8">
          Ödemeniz işlenirken bir sorun oluştu. Lütfen tekrar deneyiniz.
        </p>

        {/* Possible reasons */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-slate-900 mb-3">Olası Nedenler:</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Kart bilgileriniz hatalı girilmiş olabilir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Kartınızda yeterli bakiye bulunmuyor olabilir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Kartınızın internetten alışverişe kapalı olması</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>3D Secure doğrulaması tamamlanamamış olabilir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Bankanızın güvenlik politikaları nedeniyle işlem reddedilmiş olabilir</span>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/checkout")}
            className="w-full bg-amber-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-amber-700 transition shadow-lg"
          >
            Tekrar Dene
          </button>
          <Link
            href="/cart"
            className="w-full bg-slate-200 text-slate-900 py-4 px-6 rounded-lg font-semibold hover:bg-slate-300 transition text-center"
          >
            Sepete Dön
          </Link>
        </div>

        {/* Support info */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600 mb-2">
            Sorun devam ediyorsa, lütfen banka ile iletişime geçin veya farklı bir kart deneyin.
          </p>
          <Link
            href="/contact"
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Yardım için bize ulaşın →
          </Link>
        </div>
      </div>
    </main>
  );
}
