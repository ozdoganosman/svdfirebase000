import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AppProviders } from "@/components/app-providers";
import ExchangeRateBanner from "@/components/exchange-rate-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SVD Ambalaj | Adet Bazlı Fiyatlandırma ile E-Ticaret",
  description:
    "SVD Ambalaj için geliştirilen adet bazlı fiyatlandırma, sipariş yönetimi ve admin paneli bulunan e-ticaret platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        <AppProviders>
          <SiteHeader />
          <ExchangeRateBanner />
          <div className="min-h-screen">
            {children}
          </div>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
