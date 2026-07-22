"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type CertificateTemplate } from "@/lib/api";

export default function NewCertificatePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [certificateId, setCertificateId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [title, setTitle] = useState("Certificate of Completion");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [issuer, setIssuer] = useState("");
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    api
      .listTemplates()
      .then((res) => {
        setTemplates(res.templates);
        const active = res.templates.find((t) => t.status === "ACTIVE");
        setTemplateId(active?.id ?? res.templates[0]?.id ?? "");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load templates")
      )
      .finally(() => setLoadingTemplates(false));
  }, []);

  const activeHint = useMemo(() => {
    const active = templates.find((t) => t.status === "ACTIVE");
    return active?.templateName;
  }, [templates]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createCertificate({
        certificateId: certificateId.trim(),
        recipientName: recipientName.trim(),
        title: title.trim(),
        issueDate,
        issuer: issuer.trim(),
        templateId,
      });
      router.push(`/admin/certificates/${res.certificate.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create certificate"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/certificates"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to certificates
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Create certificate
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          PDF, QR verify URL, and SHA-256 hash are generated automatically.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Certificate ID
          </span>
          <input
            required
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            placeholder="CERT-2026-00001"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Recipient name
          </span>
          <input
            required
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Certificate title
          </span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Issue date
            </span>
            <input
              required
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Issuer name
            </span>
            <input
              required
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Template</span>
          <select
            required
            disabled={loadingTemplates || templates.length === 0}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
          >
            {templates.length === 0 ? (
              <option value="">No templates available</option>
            ) : (
              templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.templateName}
                  {template.status === "ACTIVE" ? " (Active)" : ""}
                </option>
              ))
            )}
          </select>
          {activeHint ? (
            <p className="text-xs text-slate-500">
              Active template: {activeHint}
            </p>
          ) : (
            <p className="text-xs text-amber-600">
              No active template. Create one in Templates first.
            </p>
          )}
        </label>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || templates.length === 0}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Generating PDF..." : "Create & generate PDF"}
          </button>
          <Link
            href="/admin/certificates"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
