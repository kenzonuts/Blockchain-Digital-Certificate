"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, type Certificate } from "@/lib/api";

export default function CertificateDetailPage() {
  const params = useParams<{ id: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"regen" | "download" | null>(null);

  const load = useCallback(async () => {
    if (!params.id) return;
    setError(null);
    try {
      const res = await api.getCertificate(params.id);
      setCertificate(res.certificate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function regenerate() {
    if (!certificate) return;
    setBusy("regen");
    setError(null);
    try {
      const res = await api.regenerateCertificate(certificate.id);
      setCertificate(res.certificate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setBusy(null);
    }
  }

  async function download() {
    if (!certificate) return;
    setBusy("download");
    setError(null);
    try {
      await api.downloadCertificate(
        certificate.id,
        `${certificate.certificateId}.pdf`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading certificate...</p>;
  }

  if (!certificate) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error ?? "Certificate not found"}
        </p>
        <Link
          href="/admin/certificates"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back
        </Link>
      </div>
    );
  }

  const rows: Array<[string, string]> = [
    ["Certificate ID", certificate.certificateId],
    ["Recipient", certificate.recipientName],
    ["Title", certificate.title],
    ["Issuer", certificate.issuer],
    [
      "Issue date",
      new Date(certificate.issueDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    ],
    ["Template", certificate.template?.templateName ?? "—"],
    ["SHA-256", certificate.certificateHash ?? "—"],
    ["Verify URL", certificate.verifyUrl],
    ["PDF path", certificate.pdfPath ?? "—"],
    [
      "Blockchain",
      certificate.transactionHash
        ? `Published (${certificate.transactionHash.slice(0, 12)}…)`
        : "Not published yet (Phase 4)",
    ],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/certificates"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to certificates
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {certificate.certificateId}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {certificate.recipientName} · {certificate.title}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void download()}
            disabled={busy !== null || !certificate.pdfPath}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy === "download" ? "Downloading..." : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={() => void regenerate()}
            disabled={busy !== null || Boolean(certificate.transactionHash)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy === "regen" ? "Regenerating..." : "Regenerate PDF"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <dl className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)]"
            >
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="break-all text-sm font-medium text-slate-900">
                {label === "Verify URL" ? (
                  <a
                    href={value}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
