"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type VerifyResult } from "@/lib/api";
import { VerifyResultCard, VerifyShell } from "@/components/verify-result";

export default function VerifyCertificatePage() {
  const params = useParams<{ certificateId: string }>();
  const certificateId = decodeURIComponent(params.certificateId ?? "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certificateId) return;

    let active = true;
    setLoading(true);
    setError(null);

    api
      .verifyCertificate(certificateId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Verification failed");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [certificateId]);

  return (
    <VerifyShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Verification result
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Certificate ID:{" "}
            <span className="font-medium text-slate-800">{certificateId}</span>
          </p>
        </div>

        {loading ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Checking PDF hash against blockchain...
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {result ? <VerifyResultCard result={result} /> : null}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/verify"
            className="font-medium text-blue-600 hover:underline"
          >
            Verify another ID
          </Link>
          <Link href="/" className="font-medium text-slate-600 hover:underline">
            Home
          </Link>
        </div>
      </div>
    </VerifyShell>
  );
}
