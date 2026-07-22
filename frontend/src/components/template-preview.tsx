"use client";

import { assetUrl, type CertificateTemplate } from "@/lib/api";

type Props = {
  templateName: string;
  backgroundPreview?: string | null;
  logoPreview?: string | null;
  signaturePreview?: string | null;
  stampPreview?: string | null;
  existing?: Pick<
    CertificateTemplate,
    "backgroundImage" | "logo" | "signature" | "stamp"
  > | null;
};

function resolvePreview(
  localPreview?: string | null,
  existingPath?: string | null
) {
  if (localPreview) return localPreview;
  return assetUrl(existingPath);
}

export function TemplatePreview({
  templateName,
  backgroundPreview,
  logoPreview,
  signaturePreview,
  stampPreview,
  existing,
}: Props) {
  const background = resolvePreview(
    backgroundPreview,
    existing?.backgroundImage
  );
  const logo = resolvePreview(logoPreview, existing?.logo);
  const signature = resolvePreview(signaturePreview, existing?.signature);
  const stamp = resolvePreview(stampPreview, existing?.stamp);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-medium text-slate-900">
          Preview{templateName ? ` — ${templateName}` : ""}
        </p>
      </div>
      <div className="relative aspect-[1.414/1] bg-slate-100">
        {background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={background}
            alt="Certificate background"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Upload a background to preview
          </div>
        )}

        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt="Logo"
            className="absolute left-1/2 top-[8%] h-[12%] w-auto -translate-x-1/2 object-contain drop-shadow"
          />
        ) : null}

        {signature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signature}
            alt="Signature"
            className="absolute bottom-[12%] left-[18%] h-[10%] w-auto object-contain"
          />
        ) : null}

        {stamp ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stamp}
            alt="Stamp"
            className="absolute bottom-[10%] right-[16%] h-[14%] w-auto object-contain opacity-90"
          />
        ) : null}
      </div>
    </div>
  );
}
