'use client';

import { useMemo } from "react";
import { AdminStatsOverview } from "@/lib/admin-api";

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

type CategorySalesChartProps = {
  stats: AdminStatsOverview | null;
  loading: boolean;
};

export function CategorySalesChart({ stats, loading }: CategorySalesChartProps) {
  const data = useMemo(() => {
    if (!stats) {
      return [];
    }

    // Calculate total from category sales instead of using totalRevenue
    // This ensures percentages are calculated correctly when filters are applied
    const categoryTotal = stats.categorySales.reduce((sum, entry) => sum + entry.total, 0);

    return stats.categorySales
      .slice()
      .sort((a, b) => b.total - a.total)
      .map((entry) => ({
        ...entry,
        percentage:
          categoryTotal > 0 ? Math.round((entry.total / categoryTotal) * 100) : 0,
      }));
  }, [stats]);

  if (loading) {
    return <div className="py-8 text-center text-sm text-slate-500">Kategori verileri yükleniyor...</div>;
  }

  if (!stats || data.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-500">Kategori satış verisi bulunamadı.</div>;
  }

  return (
    <div className="space-y-4">
      {data.map((entry) => (
        <div key={entry.category}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{entry.category}</span>
            <span className="text-slate-500">
              {currencyFormatter.format(entry.total)} · %{entry.percentage}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
              style={{ width: `${Math.max(entry.percentage, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
