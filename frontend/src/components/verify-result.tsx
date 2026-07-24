"use client";

import Link from "next/link";
import { type VerifyResult, type VerifyStatus } from "@/lib/api";

const statusStyles: Record<
  VerifyStatus,
  { badge: string; panel: string; label: string }
> = {
  VALID: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    panel: "border-emerald-200 bg-emerald-50/60",
    label: "VALID",
  },
  INVALID: {
    badge: "bg-red-50 text-red-700 ring-red-200",
    panel: "border-red-200 bg-red-50/60",
    label: "INVALID",
  },
  NOT_FOUND: {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    panel: "border-slate-200 bg-slate-50",
    label: "NOT FOUND",
  },
  NOT_PUBLISHED: {
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    panel: "border-amber-200 bg-amber-50/60",
    label: "NOT PUBLISHED",
  },
  PDF_MISSING: {
    badge: "bg-orange-50 text-orange-800 ring-orange-200",
    panel: "border-orange-200 bg-orange-50/60",
    label: "PDF MISSING",
  },
  CHAIN_ERROR: {
    badge: "bg-violet-50 text-violet-800 ring-violet-200",
    panel: "border-violet-200 bg-violet-50/60",
    label: "CHAIN ERROR",
  },
};

function shortHash(hash?: string | null) {
  if (!hash) return "—";
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function VerifyResultCard({ result }: { result: VerifyResult }) {
  const style = statusStyles[result.status];
  const cert = result.certificate;

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${style.panel}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ring-1 ${style.badge}`}
        >
          {style.label}
        </span>
        <p className="text-sm text-slate-700">{result.message}</p>
      </div>

      {cert ? (
        <dl className="mt-6 space-y-3 rounded-xl border border-white/70 bg-white/80 p-4 text-sm">
          {(
            [
              ["Certificate ID", cert.certificateId],
              ["Recipient", cert.recipientName],
              ["Title", cert.title],
              ["Issuer", cert.issuer],
              [
                "Issue date",
                new Date(cert.issueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
              ],
              ["Template", cert.templateName ?? "—"],
              ["Transaction", cert.transactionHash ?? "—"],
              [
                "Block",
                cert.blockNumber != null ? String(cert.blockNumber) : "—",
              ],
            ] as Array<[string, string]>
          ).map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]"
            >
              <dt className="text-slate-500">{label}</dt>
              <dd className="break-all font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {result.hashes ? (
        <dl className="mt-4 space-y-2 rounded-xl border border-white/70 bg-white/80 p-4 font-mono text-xs">
          <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]">
            <dt className="font-sans text-slate-500">PDF SHA-256</dt>
            <dd className="break-all text-slate-800">
              {shortHash(result.hashes.pdfHash)}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]">
            <dt className="font-sans text-slate-500">On-chain hash</dt>
            <dd className="break-all text-slate-800">
              {shortHash(result.hashes.onChainHash)}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)]">
            <dt className="font-sans text-slate-500">Match</dt>
            <dd className="font-sans font-medium text-slate-800">
              {result.hashes.pdfMatchesOnChain == null
                ? "—"
                : result.hashes.pdfMatchesOnChain
                  ? "Yes"
                  : "No"}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

export function VerifyShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-6">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          CertChain
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Home
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pb-16">{children}</main>
    </div>
  );
}
