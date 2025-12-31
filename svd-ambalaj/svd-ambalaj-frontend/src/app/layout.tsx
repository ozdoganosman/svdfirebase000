import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AppProviders } from "@/components/app-providers";
import { DynamicFavicon } from "@/components/dynamic-favicon";
import { OrganizationJsonLd, WebSiteJsonLd, LocalBusinessJsonLd } from "@/components/seo/json-ld";
import { GoogleAnalytics } from "@/components/google-analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spreyvalfdunyasi.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sprey Valf Dünyası | Toptan Sprey Valf ve Ambalaj Ürünleri",
    template: "%s | Sprey Valf Dünyası",
  },
  description:
    "Türkiye'nin en geniş sprey valf ve ambalaj ürünleri yelpazesi. Toptan fiyatlarla sprey başlıkları, şişeler ve ambalaj malzemeleri. Hızlı teslimat, uygun fiyat.",
  keywords: [
    "sprey valf",
    "ambalaj",
    "toptan sprey",
    "sprey başlığı",
    "pet şişe",
    "kozmetik ambalaj",
    "temizlik ürünleri ambalajı",
    "trigger sprey",
    "pompa başlık",
    "şişe kapağı",
  ],
  authors: [{ name: "Sprey Valf Dünyası" }],
  creator: "Sprey Valf Dünyası",
  publisher: "Sprey Valf Dünyası",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "Sprey Valf Dünyası",
    title: "Sprey Valf Dünyası | Toptan Sprey Valf ve Ambalaj Ürünleri",
    description:
      "Türkiye'nin en geniş sprey valf ve ambalaj ürünleri yelpazesi. Toptan fiyatlarla sprey başlıkları, şişeler ve ambalaj malzemeleri.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sprey Valf Dünyası - Toptan Sprey Valf ve Ambalaj Ürünleri",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sprey Valf Dünyası | Toptan Sprey Valf ve Ambalaj Ürünleri",
    description:
      "Türkiye'nin en geniş sprey valf ve ambalaj ürünleri yelpazesi. Toptan fiyatlarla sprey başlıkları, şişeler ve ambalaj malzemeleri.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <LocalBusinessJsonLd />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        <GoogleAnalytics />
        <AppProviders>
          <DynamicFavicon />
          <SiteHeader />
          <div className="min-h-screen">
            {children}
          </div>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
