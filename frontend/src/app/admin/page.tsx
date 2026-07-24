"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Stats = {
  totalCertificates: number;
  totalTemplates: number;
  blockchainTransactions: number;
  certificatesVerified: number;
  recentCertificates: Array<{
    id: string;
    certificateId: string;
    recipientName: string;
    title: string;
    transactionHash: string | null;
    createdAt: string;
  }>;
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of certificates, templates, publishes, and public verifies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/certificates/new"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            New certificate
          </Link>
          <Link
            href="/admin/templates/new"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            New template
          </Link>
        </div>
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

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent certificates</h2>
          <Link
            href="/admin/certificates"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {!stats ? (
          <p className="px-5 py-6 text-sm text-slate-500">Loading...</p>
        ) : stats.recentCertificates.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            No certificates yet. Create one to start the demo flow.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stats.recentCertificates.map((cert) => (
              <li key={cert.id}>
                <Link
                  href={`/admin/certificates/${cert.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {cert.certificateId}
                    </p>
                    <p className="text-sm text-slate-500">
                      {cert.recipientName} · {cert.title}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      cert.transactionHash
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {cert.transactionHash ? "Published" : "Draft"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6">
        <h2 className="font-semibold text-slate-900">Demo flow</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Upload a certificate template</li>
          <li>Create a certificate (PDF + SHA-256 + QR)</li>
          <li>Publish the hash to the smart contract</li>
          <li>Open the public verify page / QR link</li>
        </ol>
      </div>
    </div>
  );
}
