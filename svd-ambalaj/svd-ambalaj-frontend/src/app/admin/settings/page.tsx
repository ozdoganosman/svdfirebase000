"use client";

import Link from "next/link";

export default function SettingsPage() {
  const quickLinks = [
    {
      title: "Site Ayarları",
      description: "Site adı, açıklama, iletişim bilgileri",
      href: "/admin/settings/site",
      icon: "🏢",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Fiyatlandırma",
      description: "Para birimi, KDV oranı, fiyat gösterimi",
      href: "/admin/settings/pricing",
      icon: "💰",
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      title: "Döviz Kurları",
      description: "USD/TRY döviz kuru yönetimi",
      href: "/admin/settings/exchange-rates",
      icon: "💱",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    {
      title: "Kombo İndirimleri",
      description: "Başlık + Şişe kombo indirimi ayarları",
      href: "/admin/settings/combo",
      icon: "🎁",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">⚙️ Ayarlar</h2>
        <p className="text-sm text-slate-600 mt-1">
          Sistemin tüm ayarlarını buradan yönetebilirsiniz
        </p>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group block p-5 rounded-xl border ${link.color} hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {link.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{link.description}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Cards */}
      <div className="space-y-4">
        {/* Settings initialization info */}
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">
                İlk Kez mi Kullanıyorsunuz?
              </h3>
              <p className="text-xs text-blue-800 mt-1">
                Eğer ayarlar sayfalarında hata alıyorsanız, varsayılan ayarları başlatmanız gerekiyor.
              </p>
              <Link
                href="/admin/settings/initialize"
                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-xs"
              >
                <span>⚙️</span>
                Ayarları Başlat
              </Link>
            </div>
          </div>
        </div>

        {/* Super admin setup info */}
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">
                Super Admin Rolü Kurulumu
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                <strong>Önemli:</strong> Ayarları başlatmadan önce super admin rolünüzü oluşturmalısınız.
              </p>
              <ol className="list-decimal list-inside text-xs text-amber-800 mt-2 space-y-0.5">
                <li>Firebase Console → Firestore Database&apos;i açın</li>
                <li>&quot;adminRoles&quot; koleksiyonunu bulun veya oluşturun</li>
                <li>Yeni doküman ekleyin (Document ID: Firebase Auth UID&apos;niz)</li>
                <li>Alan ekleyin: <code className="bg-amber-100 px-1 rounded">role</code> = <code className="bg-amber-100 px-1 rounded">&quot;super_admin&quot;</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
