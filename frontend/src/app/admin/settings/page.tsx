"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Settings = {
  appUrl: string;
  corsOrigin: string;
  blockchainRpcUrl: string | null;
  certificateRegistryAddress: string | null;
  networkLabel: string;
  issuerWalletConfigured: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((res) => setSettings(res.settings))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load settings")
      );
  }, []);

  const rows: Array<[string, string]> = settings
    ? [
        ["App URL", settings.appUrl],
        ["CORS origin", settings.corsOrigin],
        ["Network", settings.networkLabel],
        ["RPC URL", settings.blockchainRpcUrl ?? "—"],
        ["Registry address", settings.certificateRegistryAddress ?? "—"],
        [
          "Issuer wallet",
          settings.issuerWalletConfigured ? "Configured" : "Missing",
        ],
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Runtime configuration for verification links and blockchain publish.
          Secrets stay in server env only.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!settings ? (
          <p className="px-5 py-6 text-sm text-slate-500">Loading settings...</p>
        ) : (
          <dl className="divide-y divide-slate-100">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)]"
              >
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="break-all text-sm font-medium text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Update values in <code className="rounded bg-slate-100 px-1.5 py-0.5">backend/.env</code>{" "}
        then restart the API. For Sepolia, set RPC URL, funded private key, and
        deployed registry address.
      </p>
    </div>
  );
}
