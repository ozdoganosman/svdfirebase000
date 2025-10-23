"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Lütfen e-posta adresinizi girin");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("user-not-found")) {
          setError("Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı");
        } else if (err.message.includes("invalid-email")) {
          setError("Geçersiz e-posta adresi");
        } else {
          setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
      } else {
        setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 text-slate-900">
      <div className="mx-auto max-w-md px-6">
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Şifremi Unuttum</h1>
            <p className="mt-2 text-sm text-slate-600">
              E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                <p className="font-medium">E-posta gönderildi!</p>
                <p className="mt-1">
                  <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                  Lütfen e-postanızı kontrol edin.
                </p>
              </div>

              <Link
                href="/auth/login"
                className="block w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-semibold text-white text-center shadow-md hover:from-amber-600 hover:to-amber-700 transition"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 outline-none transition"
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-semibold text-white shadow-md hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-600">
            <Link href="/auth/login" className="font-medium text-amber-600 hover:text-amber-700">
              ← Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
