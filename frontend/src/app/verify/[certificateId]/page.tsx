import Link from "next/link";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          CertChain
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Verify certificate</h1>
        <p className="mt-2 text-sm text-slate-500">
          Certificate ID:{" "}
          <span className="font-medium text-slate-800">{certificateId}</span>
        </p>
        <p className="mt-3 text-sm text-slate-500">
          On-chain comparison lands in Phase 5. This route is ready for QR links
          generated in Phase 3.
        </p>
        <Link
          href="/verify"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Enter another ID
        </Link>
      </div>
    </div>
  );
}
