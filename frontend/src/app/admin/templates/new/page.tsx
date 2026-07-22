import Link from "next/link";
import { TemplateForm } from "@/components/template-form";

export default function NewTemplatePage() {
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
          Create template
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload background, logo, and optional signature/stamp assets.
        </p>
      </div>
      <TemplateForm mode="create" />
    </div>
  );
}
