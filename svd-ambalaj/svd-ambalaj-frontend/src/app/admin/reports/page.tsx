"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchDashboardSummary,
  fetchSalesReport,
  fetchCustomerAnalytics,
  fetchProductAnalytics,
  getExportUrl,
  DashboardSummary,
  SalesReport,
  CustomerAnalytics,
  ProductAnalytics,
  SalesReportFilters,
} from "@/lib/admin-api";

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

const numberFormatter = new Intl.NumberFormat("tr-TR");

type TabType = "overview" | "sales" | "customers" | "products";
type PeriodType = "today" | "last7days" | "last30days" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

const PERIOD_OPTIONS = [
  { value: "today", label: "Bugun" },
  { value: "last7days", label: "Son 7 Gun" },
  { value: "last30days", label: "Son 30 Gun" },
  { value: "thisMonth", label: "Bu Ay" },
  { value: "lastMonth", label: "Gecen Ay" },
  { value: "thisYear", label: "Bu Yil" },
  { value: "custom", label: "Ozel Tarih" },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [period, setPeriod] = useState<PeriodType>("last30days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [groupBy, setGroupBy] = useState<"daily" | "weekly" | "monthly">("daily");

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [customerData, setCustomerData] = useState<CustomerAnalytics | null>(null);
  const [productData, setProductData] = useState<ProductAnalytics | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define callbacks first (before useEffects)
  const getFilters = useCallback((): SalesReportFilters => {
    if (period === "custom") {
      return { from: customFrom, to: customTo, groupBy };
    }
    return { period, groupBy };
  }, [period, customFrom, customTo, groupBy]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary();
      setDashboardData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSalesReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSalesReport(getFilters());
      setSalesData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getFilters]);

  const loadCustomerAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomerAnalytics(period === "custom" ? undefined : period);
      setCustomerData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const loadProductAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductAnalytics(period === "custom" ? undefined : period);
      setProductData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Load dashboard data
  useEffect(() => {
    if (activeTab === "overview") {
      loadDashboard();
    }
  }, [activeTab, loadDashboard]);

  // Load tab-specific data when tab or filters change
  useEffect(() => {
    if (activeTab === "sales") {
      loadSalesReport();
    } else if (activeTab === "customers") {
      loadCustomerAnalytics();
    } else if (activeTab === "products") {
      loadProductAnalytics();
    }
  }, [activeTab, loadSalesReport, loadCustomerAnalytics, loadProductAnalytics]);

  const handleExport = (type: "orders" | "customers" | "products" | "sales") => {
    const url = getExportUrl(type, getFilters());
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raporlar ve Analitik</h1>
          <p className="text-sm text-slate-500 mt-1">
            Satis, musteri ve urun performansini analiz edin
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          {[
            { key: "overview", label: "Genel Bakis" },
            { key: "sales", label: "Satis Raporlari" },
            { key: "customers", label: "Musteri Analizi" },
            { key: "products", label: "Urun Performansi" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters (not for overview) */}
      {activeTab !== "overview" && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Donem</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {period === "custom" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Baslangic</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bitis</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </>
          )}

          {activeTab === "sales" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Gruplama</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as "daily" | "weekly" | "monthly")}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="daily">Gunluk</option>
                <option value="weekly">Haftalik</option>
                <option value="monthly">Aylik</option>
              </select>
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExport(activeTab === "sales" ? "sales" : activeTab === "customers" ? "customers" : "products")}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              CSV Indir
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {activeTab === "overview" && <OverviewTab data={dashboardData} loading={loading} onExport={handleExport} />}
        {activeTab === "sales" && <SalesTab data={salesData} loading={loading} />}
        {activeTab === "customers" && <CustomersTab data={customerData} loading={loading} />}
        {activeTab === "products" && <ProductsTab data={productData} loading={loading} />}
      </div>
    </div>
  );
}

// ===== TAB COMPONENTS =====

function OverviewTab({
  data,
  loading,
  onExport,
}: {
  data: DashboardSummary | null;
  loading: boolean;
  onExport: (type: "orders" | "customers" | "products" | "sales") => void;
}) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <EmptyState message="Veri yuklenemedi" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Bugunun Cirosu"
          value={currencyFormatter.format(data.todayRevenue)}
          subtitle={`${data.todayOrders} siparis`}
          color="indigo"
        />
        <SummaryCard
          title="Bu Ayin Cirosu"
          value={currencyFormatter.format(data.thisMonthRevenue)}
          subtitle={`${data.thisMonthOrders} siparis`}
          trend={data.revenueGrowth}
          color="green"
        />
        <SummaryCard
          title="Toplam Musteri"
          value={numberFormatter.format(data.totalCustomers)}
          subtitle={`+${data.newCustomersThisMonth} bu ay`}
          color="blue"
        />
        <SummaryCard
          title="Ort. Siparis Degeri"
          value={currencyFormatter.format(data.averageOrderValue)}
          color="purple"
        />
      </div>

      {/* Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Siparis Durumlari</h3>
          <div className="space-y-3">
            {Object.entries(data.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 capitalize">{getStatusLabel(status)}</span>
                <span className="text-sm font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Bekleyen Islemler</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-sm text-amber-800">Bekleyen Siparisler</span>
              <span className="text-lg font-bold text-amber-700">{data.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">Bekleyen Teklifler</span>
              <span className="text-lg font-bold text-blue-700">{data.pendingQuotes}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-purple-800">Bekleyen Numuneler</span>
              <span className="text-lg font-bold text-purple-700">{data.pendingSamples}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Hizli Export</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onExport("orders")}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            Siparisleri Indir
          </button>
          <button
            onClick={() => onExport("customers")}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
          >
            Musterileri Indir
          </button>
          <button
            onClick={() => onExport("products")}
            className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100"
          >
            Urunleri Indir
          </button>
        </div>
      </div>
    </div>
  );
}

function SalesTab({ data, loading }: { data: SalesReport | null; loading: boolean }) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <EmptyState message="Satis verisi bulunamadi" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Toplam Ciro"
          value={currencyFormatter.format(data.totals.revenue)}
          color="green"
        />
        <SummaryCard
          title="Siparis Sayisi"
          value={numberFormatter.format(data.totals.orders)}
          color="blue"
        />
        <SummaryCard
          title="Satilan Urun"
          value={numberFormatter.format(data.totals.items)}
          color="purple"
        />
        <SummaryCard
          title="Ort. Siparis"
          value={currencyFormatter.format(data.totals.averageOrderValue)}
          color="indigo"
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Satis Detaylari</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Donem</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Siparis</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Urun</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ciro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.salesData.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{row.period}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.orders}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">{row.items}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">
                    {currencyFormatter.format(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CustomersTab({ data, loading }: { data: CustomerAnalytics | null; loading: boolean }) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <EmptyState message="Musteri verisi bulunamadi" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Toplam Musteri"
          value={numberFormatter.format(data.totalCustomers)}
          color="blue"
        />
        <SummaryCard
          title="Aktif Musteri"
          value={numberFormatter.format(data.activeCustomers)}
          color="green"
        />
        <SummaryCard
          title="Yeni Musteri"
          value={numberFormatter.format(data.newCustomers)}
          color="purple"
        />
        <SummaryCard
          title="Ort. Musteri Degeri"
          value={currencyFormatter.format(data.averageCustomerValue)}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Musteri Segmentleri</h3>
          <div className="space-y-4">
            <SegmentBar label="Yeni (1 siparis)" count={data.segments.new} total={data.activeCustomers} color="blue" />
            <SegmentBar label="Tekrar Eden (2-3 siparis)" count={data.segments.returning} total={data.activeCustomers} color="green" />
            <SegmentBar label="Sadik (4+ siparis)" count={data.segments.loyal} total={data.activeCustomers} color="purple" />
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">En Iyi Musteriler</h3>
          <div className="space-y-3">
            {data.topCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                    <p className="text-xs text-slate-500">{customer.orders} siparis</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {currencyFormatter.format(customer.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ data, loading }: { data: ProductAnalytics | null; loading: boolean }) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <EmptyState message="Urun verisi bulunamadi" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Toplam Urun"
          value={numberFormatter.format(data.totalProducts)}
          color="blue"
        />
        <SummaryCard
          title="Satilan Adet"
          value={numberFormatter.format(data.totalSoldQuantity)}
          color="green"
        />
        <SummaryCard
          title="Dusuk Stok"
          value={numberFormatter.format(data.lowStock.length)}
          color="amber"
        />
        <SummaryCard
          title="Stokta Yok"
          value={numberFormatter.format(data.outOfStock.length)}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">En Cok Satan Urunler</h3>
          <div className="space-y-3">
            {data.topSellers.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.quantitySold} adet satildi</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {currencyFormatter.format(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Kategori Performansi</h3>
          <div className="space-y-3">
            {data.categoryBreakdown.slice(0, 5).map((cat) => (
              <div key={cat.category} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{cat.category}</p>
                  <p className="text-xs text-slate-500">{cat.quantity} adet satildi</p>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {currencyFormatter.format(cat.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      {data.lowStock.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-4">Dusuk Stok Uyarisi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.lowStock.slice(0, 6).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                </div>
                <span className="text-sm font-bold text-amber-700">{product.stock} adet</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Out of Stock */}
      {data.outOfStock.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">Stokta Olmayan Urunler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.outOfStock.slice(0, 6).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                </div>
                <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">Stokta Yok</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== HELPER COMPONENTS =====

function SummaryCard({
  title,
  value,
  subtitle,
  trend,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  color: "indigo" | "green" | "blue" | "purple" | "amber" | "red";
}) {
  const colorClasses = {
    indigo: "bg-indigo-50 border-indigo-200",
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    purple: "bg-purple-50 border-purple-200",
    amber: "bg-amber-50 border-amber-200",
    red: "bg-red-50 border-red-200",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <p className="text-xs font-medium text-slate-600 mb-1">{title}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {trend >= 0 ? "+" : ""}{trend}% gecen aya gore
        </p>
      )}
    </div>
  );
}

function SegmentBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: "blue" | "green" | "purple";
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{count}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-4xl mb-3">-</div>
      <p className="text-slate-600">{message}</p>
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Beklemede",
    confirmed: "Onaylandi",
    processing: "Hazirlaniyor",
    shipped: "Kargoda",
    delivered: "Teslim Edildi",
    cancelled: "Iptal",
  };
  return labels[status] || status;
}
