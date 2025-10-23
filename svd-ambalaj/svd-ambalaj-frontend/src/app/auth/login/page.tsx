"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const redirectTo = searchParams.get("redirect") || "/account";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Lütfen tüm alanları doldurun");
      return;
    }

    setLoading(true);

    try {
      await signIn(formData);
      router.push(redirectTo);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("invalid-credential") || err.message.includes("user-not-found") || err.message.includes("wrong-password")) {
          setError("E-posta veya şifre hatalı");
        } else if (err.message.includes("too-many-requests")) {
          setError("Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.");
        } else {
          setError("Giriş yapılamadı. Lütfen tekrar deneyin.");
        }
      } else {
        setError("Giriş yapılamadı. Lütfen tekrar deneyin.");
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
            <h1 className="text-3xl font-bold text-slate-900">Giriş Yap</h1>
            <p className="mt-2 text-sm text-slate-600">
              Hesabınıza giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 outline-none transition"
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                <span className="ml-2 text-slate-600">Beni hatırla</span>
              </label>
              <Link href="/auth/reset-password" className="font-medium text-amber-600 hover:text-amber-700">
                Şifremi unuttum
              </Link>
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
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Hesabınız yok mu?{" "}
            <Link href="/auth/register" className="font-medium text-amber-600 hover:text-amber-700">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
