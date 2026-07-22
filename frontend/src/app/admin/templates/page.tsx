"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  api,
  assetUrl,
  type CertificateTemplate,
} from "@/lib/api";
import { TemplatePreview } from "@/components/template-preview";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.listTemplates();
      setTemplates(res.templates);
      setSelectedId((prev) => prev ?? res.templates[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  async function activate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.activateTemplate(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    try {
      await api.deleteTemplate(id);
      setSelectedId((prev) => (prev === id ? null : prev));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Templates</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload your own certificate visuals. Only one template can be active.
          </p>
        </div>
        <Link
          href="/admin/templates/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New template
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading templates...</p>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-900">No templates yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first certificate background template.
          </p>
          <Link
            href="/admin/templates/new"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create template
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-3">
            {templates.map((template) => {
              const thumb = assetUrl(template.backgroundImage);
              const isSelected = template.id === selectedId;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedId(template.id)}
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                    isSelected
                      ? "border-blue-300 ring-4 ring-blue-600/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-slate-900">
                          {template.templateName}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            template.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {template.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Created{" "}
                        {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/admin/templates/${template.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        {template.status !== "ACTIVE" ? (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              void activate(template.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                void activate(template.id);
                              }
                            }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            {busyId === template.id
                              ? "Working..."
                              : "Set active"}
                          </span>
                        ) : null}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            void remove(template.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              void remove(template.id);
                            }
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selected ? (
            <TemplatePreview
              templateName={selected.templateName}
              existing={selected}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
