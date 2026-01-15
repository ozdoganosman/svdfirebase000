"use client";

interface Order {
  id: string;
  status: string;
  totals: {
    total: number;
    currency: string;
  };
}

interface OrderStatsProps {
  orders: Order[];
}

function formatPrice(price: number, currency: string = "TRY"): string {
  return price.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " " + currency;
}

export function OrderStats({ orders }: OrderStatsProps) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => ["pending", "confirmed", "processing"].includes(o.status.toLowerCase())).length;
  const shippedOrders = orders.filter(o => o.status.toLowerCase() === "shipped").length;
  const completedOrders = orders.filter(o => o.status.toLowerCase() === "delivered").length;

  const currency = orders[0]?.totals?.currency || "TRY";
  const totalSpent = orders
    .filter(o => o.status.toLowerCase() !== "cancelled")
    .reduce((sum, o) => sum + (o.totals?.total || 0), 0);

  const stats = [
    {
      label: "Toplam Sipariş",
      value: totalOrders.toString(),
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: "bg-slate-100 text-slate-600",
    },
    {
      label: "Hazırlanıyor",
      value: pendingOrders.toString(),
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-amber-100 text-amber-600",
    },
    {
      label: "Kargoda",
      value: shippedOrders.toString(),
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Tamamlandı",
      value: completedOrders.toString(),
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-green-100 text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Total Spent - Full Width on Mobile */}
      <div className="col-span-2 sm:col-span-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-50 to-amber-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-200 text-amber-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-amber-700">Toplam Harcama</p>
              <p className="text-2xl font-bold text-amber-800">{formatPrice(totalSpent, currency)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
