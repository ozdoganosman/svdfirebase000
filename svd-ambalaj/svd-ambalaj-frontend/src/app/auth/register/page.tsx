"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

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

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    if (formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setLoading(true);

    try {
      // Create Firebase Auth user
      await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
      });

      // Get the newly created user's UID
      const auth = await import("@/lib/firebase-client");
      const currentUser = auth.auth.currentUser;

      if (currentUser) {
        // Create user document in Firestore
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/svdfirebase000/us-central1/api";

        try {
          await fetch(`${apiBase}/user/profile?userId=${currentUser.uid}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              displayName: formData.name,
              phone: formData.phone || "",
              company: "",
              taxNumber: "",
            }),
          });
        } catch (createError) {
          console.error("Error creating user profile:", createError);
          // Continue anyway - user can update profile later
        }
      }

      router.push("/account");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("Bu e-posta adresi zaten kullanılıyor");
        } else if (err.message.includes("invalid-email")) {
          setError("Geçersiz e-posta adresi");
        } else if (err.message.includes("weak-password")) {
          setError("Şifre çok zayıf");
        } else {
          setError("Kayıt olunamadı. Lütfen tekrar deneyin.");
        }
      } else {
        setError("Kayıt olunamadı. Lütfen tekrar deneyin.");
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
            <h1 className="text-3xl font-bold text-slate-900">Kayıt Ol</h1>
            <p className="mt-2 text-sm text-slate-600">
              Hesabınızı oluşturun ve siparişlerinizi yönetin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 outline-none transition"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                E-posta <span className="text-red-500">*</span>
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
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 outline-none transition"
                placeholder="0555 123 45 67"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Şifre <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 outline-none transition"
                placeholder="••••••••"
                minLength={6}
                required
              />
              <p className="mt-1 text-xs text-slate-500">En az 6 karakter</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Şifre Tekrar <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-20 outline-none transition"
                placeholder="••••••••"
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
              {loading ? "Kayıt Oluşturuluyor..." : "Kayıt Ol"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Zaten hesabınız var mı?{" "}
            <Link href="/auth/login" className="font-medium text-amber-600 hover:text-amber-700">
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
