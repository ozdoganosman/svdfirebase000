'use client';

import { useEffect, useState } from "react";
import {
  AdminCustomer,
  fetchCustomers,
} from "@/lib/admin-api";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const customersData = await fetchCustomers();
      setCustomers(customersData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Müşteri Yönetimi</h1>
            <p className="text-sm text-slate-600">
              Kayıtlı müşterileri görüntüleyin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-400"
            >
              Yenile
            </button>
          </div>
        </div>
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Müşteriler yükleniyor...</div>
        ) : customers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Henüz kayıtlı müşteri yok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Müşteri</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">E-posta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Firma</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.uid} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{customer.displayName || "İsimsiz"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.company || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("tr-TR") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
