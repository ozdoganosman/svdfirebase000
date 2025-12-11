"use client";

import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { SessionWarning } from "@/components/admin/session-warning";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-100">
        <SessionWarning />
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
          <AdminNav />
          <main className="flex-1 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
