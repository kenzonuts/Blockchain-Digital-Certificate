"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Stats = {
  totalCertificates: number;
  totalTemplates: number;
  blockchainTransactions: number;
  certificatesVerified: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .dashboardStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load stats")
      );
  }, []);

  const cards = [
    { label: "Total Certificates", value: stats?.totalCertificates ?? "—" },
    { label: "Total Templates", value: stats?.totalTemplates ?? "—" },
    {
      label: "Blockchain Transactions",
      value: stats?.blockchainTransactions ?? "—",
    },
    {
      label: "Certificates Verified",
      value: stats?.certificatesVerified ?? "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of certificates, templates, and on-chain publishes.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Phase 1 shell ready. Template and certificate management arrive in
        Phase 2–3.
      </div>
    </div>
  );
}
