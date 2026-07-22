"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  type CertificateTemplate,
} from "@/lib/api";
import { TemplatePreview } from "@/components/template-preview";

type Props = {
  mode: "create" | "edit";
  initial?: CertificateTemplate;
};

type PreviewState = {
  background?: string | null;
  logo?: string | null;
  signature?: string | null;
  stamp?: string | null;
};

function revokeIfBlob(url?: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function TemplateForm({ mode, initial }: Props) {
  const router = useRouter();
  const [templateName, setTemplateName] = useState(initial?.templateName ?? "");
  const [setActive, setSetActive] = useState(mode === "create");
  const [files, setFiles] = useState<{
    backgroundImage?: File | null;
    logo?: File | null;
    signature?: File | null;
    stamp?: File | null;
  }>({});
  const [clear, setClear] = useState({
    logo: false,
    signature: false,
    stamp: false,
  });
  const [preview, setPreview] = useState<PreviewState>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      revokeIfBlob(preview.background);
      revokeIfBlob(preview.logo);
      revokeIfBlob(preview.signature);
      revokeIfBlob(preview.stamp);
    };
  }, [preview]);

  const existingForPreview = useMemo(() => {
    if (!initial) return null;
    return {
      backgroundImage: initial.backgroundImage,
      logo: clear.logo ? null : initial.logo,
      signature: clear.signature ? null : initial.signature,
      stamp: clear.stamp ? null : initial.stamp,
    };
  }, [initial, clear]);

  function onFileChange(
    field: keyof typeof files,
    fileList: FileList | null
  ) {
    const file = fileList?.[0] ?? null;
    setFiles((prev) => ({ ...prev, [field]: file }));

    const previewKey =
      field === "backgroundImage"
        ? "background"
        : (field as "logo" | "signature" | "stamp");

    setPreview((prev) => {
      revokeIfBlob(prev[previewKey]);
      return {
        ...prev,
        [previewKey]: file ? URL.createObjectURL(file) : null,
      };
    });

    if (field !== "backgroundImage" && file) {
      setClear((prev) => ({ ...prev, [field]: false }));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("templateName", templateName.trim());

      if (mode === "create") {
        formData.append("setActive", String(setActive));
        if (!files.backgroundImage) {
          throw new Error("Background template image is required");
        }
      }

      if (files.backgroundImage) {
        formData.append("backgroundImage", files.backgroundImage);
      }
      if (files.logo) formData.append("logo", files.logo);
      if (files.signature) formData.append("signature", files.signature);
      if (files.stamp) formData.append("stamp", files.stamp);

      if (mode === "edit") {
        if (clear.logo) formData.append("clearLogo", "true");
        if (clear.signature) formData.append("clearSignature", "true");
        if (clear.stamp) formData.append("clearStamp", "true");
      }

      if (mode === "create") {
        await api.createTemplate(formData);
      } else if (initial) {
        await api.updateTemplate(initial.id, formData);
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Template name
          </span>
          <input
            required
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-600/20 focus:border-blue-500 focus:ring-4"
            placeholder="Company Certificate 2026"
          />
        </label>

        {(
          [
            ["backgroundImage", "Background template", true],
            ["logo", "Logo", false],
            ["signature", "Signature (optional)", false],
            ["stamp", "Company stamp (optional)", false],
          ] as const
        ).map(([field, label, required]) => (
          <div key={field} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              {mode === "edit" &&
              field !== "backgroundImage" &&
              initial?.[field] &&
              !clear[field as "logo" | "signature" | "stamp"] ? (
                <button
                  type="button"
                  onClick={() => {
                    setClear((prev) => ({ ...prev, [field]: true }));
                    setFiles((prev) => ({ ...prev, [field]: null }));
                    setPreview((prev) => {
                      const key = field as "logo" | "signature" | "stamp";
                      revokeIfBlob(prev[key]);
                      return { ...prev, [key]: null };
                    });
                  }}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required={mode === "create" && required}
              onChange={(e) => onFileChange(field, e.target.files)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        ))}

        {mode === "create" ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={setActive}
              onChange={(e) => setSetActive(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Set as active template
          </label>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : mode === "create"
                ? "Create template"
                : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/templates")}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <TemplatePreview
        templateName={templateName}
        backgroundPreview={preview.background}
        logoPreview={preview.logo}
        signaturePreview={preview.signature}
        stampPreview={preview.stamp}
        existing={existingForPreview}
      />
    </form>
  );
}
