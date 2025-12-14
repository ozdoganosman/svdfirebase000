"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import Link from "next/link";
import { loadRecaptcha, executeRecaptcha } from "@/lib/recaptcha";
import { resolveServerApiUrl } from "@/lib/server-api";

export default function ContactPage() {
  const { siteSettings } = useSettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Load reCAPTCHA on component mount
  useEffect(() => {
    loadRecaptcha().catch(console.error);
  }, []);

  const supportEmail = siteSettings?.supportEmail || "info@spreyvalfdunyasi.com";
  const supportPhone = siteSettings?.supportPhone || "+90 507 607 89 06";
  const address = siteSettings?.address || "";
  const city = siteSettings?.city || "İstanbul";
  const district = siteSettings?.district || "";
  const workingHours = siteSettings?.workingHours || "09:00 - 18:00";
  const workingDays = siteSettings?.workingDays || "Pazartesi - Cuma";
  const whatsapp = siteSettings?.socialMedia?.whatsapp || "5076078906";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha("contact_form");

      // Send to backend API
      const response = await fetch(resolveServerApiUrl("/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Mesaj gönderilemedi");
      }

      setSubmitStatus("success");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: "Telefon",
      value: supportPhone,
      href: `tel:${supportPhone.replace(/\s/g, "")}`,
      description: "Hafta içi arayabilirsiniz",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "E-posta",
      value: supportEmail,
      href: `mailto:${supportEmail}`,
      description: "24 saat içinde yanıt",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      title: "WhatsApp",
      value: "WhatsApp ile yazın",
      href: `https://wa.me/90${whatsapp}`,
      description: "Hızlı iletişim için",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
            Bize Ulaşın
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
            İletişim
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya toptan sipariş talepleriniz için
            bizimle iletişime geçebilirsiniz.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="space-y-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                target={method.href.startsWith("https") ? "_blank" : undefined}
                rel={method.href.startsWith("https") ? "noopener noreferrer" : undefined}
                className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-md border border-slate-100 hover:shadow-lg hover:border-amber-200 transition"
              >
                <div className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-amber-100 p-3 text-amber-600">
                  {method.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{method.title}</h3>
                  <p className="mt-1 text-amber-600 font-medium">{method.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{method.description}</p>
                </div>
              </a>
            ))}

            {/* Address Card */}
            <div className="rounded-xl bg-white p-5 shadow-md border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-amber-100 p-3 text-amber-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Adres</h3>
                  <p className="mt-1 text-slate-600">
                    {address && <span>{address}<br /></span>}
                    {district && <span>{district}, </span>}
                    {city}
                  </p>
                </div>
              </div>
            </div>

            {/* Working Hours Card */}
            <div className="rounded-xl bg-white p-5 shadow-md border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-amber-100 p-3 text-amber-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Çalışma Saatleri</h3>
                  <p className="mt-1 text-slate-600">{workingDays}</p>
                  <p className="text-slate-600">{workingHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-lg border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Mesaj Gönderin
              </h2>

              {submitStatus === "success" ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                  <div className="inline-flex items-center justify-center rounded-full bg-emerald-100 p-3 text-emerald-600 mb-4">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-800">Mesajınız Gönderildi!</h3>
                  <p className="mt-2 text-emerald-600">En kısa sürede size dönüş yapacağız.</p>
                  <button
                    onClick={() => setSubmitStatus("idle")}
                    className="mt-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Yeni mesaj gönder
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                        placeholder="Adınız Soyadınız"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                        E-posta *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
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
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                        placeholder="0500 000 00 00"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                        Konu *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                      >
                        <option value="">Konu Seçin</option>
                        <option value="toptan-siparis">Toptan Sipariş</option>
                        <option value="fiyat-teklifi">Fiyat Teklifi</option>
                        <option value="urun-bilgisi">Ürün Bilgisi</option>
                        <option value="siparis-takip">Sipariş Takip</option>
                        <option value="iade-degisim">İade/Değişim</option>
                        <option value="diger">Diğer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                      Mesajınız *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition resize-none"
                      placeholder="Mesajınızı buraya yazın..."
                    />
                  </div>

                  {submitStatus === "error" && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                      {errorMessage || "Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin."}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Mesaj Gönder
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* FAQ Link */}
            <div className="mt-6 rounded-xl bg-slate-100 p-5 text-center">
              <p className="text-slate-600">
                Sıkça sorulan sorulara göz atmak ister misiniz?
              </p>
              <Link
                href="/faq"
                className="mt-2 inline-flex items-center text-amber-600 font-medium hover:text-amber-700"
              >
                SSS Sayfasına Git
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
