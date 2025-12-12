'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Gösterge Paneli", icon: "📊" },
  { href: "/admin/products", label: "Ürünler", icon: "📦" },
  { href: "/admin/categories", label: "Kategoriler", icon: "📁" },
  { href: "/admin/media", label: "Medya", icon: "🖼️" },
  { href: "/admin/landing", label: "Landing Medya", icon: "🏠" },
  { href: "/admin/orders", label: "Siparişler", icon: "🛒" },
  { href: "/admin/quotes", label: "Teklifler", icon: "📋" },
  { href: "/admin/samples", label: "Numune Talepleri", icon: "🧪" },
  { href: "/admin/customers", label: "Müşteriler", icon: "👥" },
  { href: "/admin/stats", label: "İstatistikler", icon: "📈" },
  // Ayarlar sayfaları
  { href: "/admin/settings/site", label: "Site Ayarları", icon: "🏢" },
  { href: "/admin/settings/pricing", label: "Fiyatlandırma", icon: "💰" },
  { href: "/admin/settings/exchange-rates", label: "Döviz Kurları", icon: "💱" },
  { href: "/admin/settings/combo", label: "Kombo İndirimleri", icon: "🎁" },
  { href: "/admin/settings/email", label: "E-posta Ayarları", icon: "📧" },
  { href: "/admin/settings/payment", label: "Ödeme Ayarları", icon: "💳" },
  { href: "/admin/settings/stock", label: "Stok Yönetimi", icon: "📊" },
];

export function AdminNav() {
  const pathname = usePathname();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("svd_admin_token");
      window.location.reload();
    }
  };

  return (
    <aside className="hidden w-56 shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm md:block">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-slate-200 px-4 py-4">
          <Link href="/admin" className="block">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">SVD Ambalaj</p>
            <h1 className="text-base font-semibold text-slate-900">Yönetim Paneli</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Çıkış Yap
          </button>
        </div>
      </div>
    </aside>
  );
}
