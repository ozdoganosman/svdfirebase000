"use client";

import Link from "next/link";

export default function SettingsPage() {
  const quickLinks = [
    {
      title: "Site Ayarları",
      description: "Site adı, açıklama, iletişim bilgileri",
      href: "/admin/settings/site",
      icon: "🏢",
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Fiyatlandırma",
      description: "Para birimi, KDV oranı, fiyat gösterimi",
      href: "/admin/settings/pricing",
      icon: "💰",
      color: "bg-green-50 text-green-700",
    },
    {
      title: "Döviz Kurları",
      description: "USD/TRY döviz kuru yönetimi",
      href: "/admin/settings/exchange-rates",
      icon: "💱",
      color: "bg-yellow-50 text-yellow-700",
    },
    {
      title: "Kombo İndirimleri",
      description: "Başlık + Şişe kombo indirimi ayarları",
      href: "/admin/settings/combo",
      icon: "🎁",
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "Kampanyalar",
      description: "İndirim ve promosyon yönetimi",
      href: "/admin/settings/campaigns",
      icon: "🎯",
      color: "bg-pink-50 text-pink-700",
    },
    {
      title: "Admin Rolleri",
      description: "Kullanıcı rolleri ve yetkileri",
      href: "/admin/settings/roles",
      icon: "👥",
      color: "bg-indigo-50 text-indigo-700",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Ayarlara Hoş Geldiniz
        </h2>
        <p className="text-slate-600 mt-2">
          Sistemin tüm ayarlarını buradan yönetebilirsiniz. Hızlı erişim için aşağıdaki bağlantıları kullanın.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group block p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl ${link.color} flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-200`}
              >
                {link.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors mb-1">
                  {link.title}
                </h3>
                <p className="text-xs text-slate-600 leading-snug">{link.description}</p>
              </div>
              <div className="flex items-center text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                Görüntüle
                <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 space-y-4">
        {/* Settings initialization info */}
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">
                İlk Kez mi Kullanıyorsunuz?
              </h3>
              <p className="text-sm text-blue-800 mt-2">
                Eğer ayarlar sayfalarında 404 hatası alıyorsanız, varsayılan ayarları başlatmanız gerekiyor.
              </p>
              <a
                href="/admin/settings/initialize"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
              >
                <span>⚙️</span>
                Ayarları Başlat
              </a>
            </div>
          </div>
        </div>

        {/* Super admin setup info */}
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900">
                Super Admin Rolü Kurulumu
              </h3>
              <p className="text-sm text-amber-800 mt-2">
                <strong>Önemli:</strong> Ayarları başlatmadan önce super admin rolünüzü oluşturmalısınız:
              </p>
              <ol className="list-decimal list-inside text-sm text-amber-800 mt-3 space-y-1">
                <li>Firebase Console &gt; Firestore Database&apos;i açın</li>
                <li>&quot;adminRoles&quot; koleksiyonunu bulun veya oluşturun</li>
                <li>Yeni doküman ekleyin (Document ID: Firebase Auth UID&apos;niz)</li>
                <li>Alan ekleyin: <code className="bg-amber-100 px-1 rounded">role</code> = <code className="bg-amber-100 px-1 rounded">&quot;super_admin&quot;</code></li>
                <li>Sayfayı yenileyin ve ayarları başlatın</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
