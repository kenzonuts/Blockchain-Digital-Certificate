import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          CertChain
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Verify certificate</h1>
        <p className="mt-2 text-sm text-slate-500">
          Public verification lands in Phase 5. Skeleton page is ready for
          routing and QR links.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
