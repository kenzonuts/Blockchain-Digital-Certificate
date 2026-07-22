"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TemplateForm } from "@/components/template-form";
import { api, type CertificateTemplate } from "@/lib/api";

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    api
      .getTemplate(params.id)
      .then((res) => setTemplate(res.template))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/templates"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to templates
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Edit template
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Replace assets or update the template name.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : template ? (
        <TemplateForm mode="edit" initial={template} />
      ) : null}
    </div>
  );
}
