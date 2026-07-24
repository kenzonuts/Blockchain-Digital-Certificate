"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { VerifyShell } from "@/components/verify-result";

export default function VerifyPage() {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = certificateId.trim();
    if (!id) return;
    router.push(`/verify/${encodeURIComponent(id)}`);
  }

  return (
    <VerifyShell>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Verify certificate
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter a Certificate ID or open a QR link. We recompute the PDF SHA-256
          and compare it with the on-chain hash.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Certificate ID
            </span>
            <input
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="CERT-2026-00001"
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Verify
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </VerifyShell>
  );
}
