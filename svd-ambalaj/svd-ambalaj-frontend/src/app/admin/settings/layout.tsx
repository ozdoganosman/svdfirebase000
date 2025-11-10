"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsSections = [
  {
    title: "Genel Ayarlar",
    items: [
      { name: "Site Ayarları", href: "/admin/settings/site", icon: "🏢" },
      { name: "Fiyatlandırma", href: "/admin/settings/pricing", icon: "💰" },
      { name: "Döviz Kurları", href: "/admin/settings/exchange-rates", icon: "💱" },
      { name: "Kombo İndirimleri", href: "/admin/settings/combo", icon: "🎁" },
    ],
  },
  {
    title: "İş Operasyonları",
    items: [
      { name: "Stok Yönetimi", href: "/admin/settings/stock", icon: "📦" },
      { name: "Kampanyalar", href: "/admin/settings/campaigns", icon: "🎯" },
    ],
  },
  {
    title: "İletişim ve Entegrasyonlar",
    items: [
      { name: "E-posta Ayarları", href: "/admin/settings/email", icon: "📧" },
      { name: "Ödeme Ayarları", href: "/admin/settings/payment", icon: "💳" },
    ],
  },
  {
    title: "İçerik Yönetimi",
    items: [
      { name: "Ana Sayfa İçeriği", href: "/admin/settings/content/landing", icon: "🏠" },
      { name: "Footer", href: "/admin/settings/content/footer", icon: "📄" },
      { name: "SSS", href: "/admin/settings/content/faq", icon: "❓" },
      { name: "Hakkımızda", href: "/admin/settings/content/about", icon: "ℹ️" },
    ],
  },
  {
    title: "SEO ve Analitik",
    items: [
      { name: "SEO Ayarları", href: "/admin/settings/seo", icon: "🔍" },
    ],
  },
  {
    title: "Kullanıcı ve Rol Yönetimi",
    items: [
      { name: "Admin Rolleri", href: "/admin/settings/roles", icon: "👥" },
    ],
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
              <p className="text-sm text-slate-600 mt-1">
                Sistem ayarlarını yönetin
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ← Admin Paneline Dön
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-6 sticky top-8">
              {settingsSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                              ${
                                isActive
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-slate-700 hover:bg-slate-100"
                              }
                            `}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
