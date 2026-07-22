import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.1),_transparent_35%)]" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            CertChain
          </p>
          <p className="text-sm text-slate-500">Blockchain Digital Certificate</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Verify
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
          >
            Admin Login
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-16 md:pt-24">
        <section className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
            Certificates you can prove — without putting PDFs on-chain.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Issue branded digital certificates, store only the SHA-256 hash on a
            smart contract, and let anyone verify authenticity via Certificate ID
            or QR code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              Open Admin
            </Link>
            <Link
              href="/verify"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Verify a certificate
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Hash-only proof",
              body: "Blockchain stores certificate ID, hash, issuer, and timestamp — never the PDF file.",
            },
            {
              title: "Your visual identity",
              body: "Upload your own template, logo, signature, and stamp. No generic certificate design.",
            },
            {
              title: "Instant verification",
              body: "Scan a QR or enter a Certificate ID. Recalculate SHA-256 and compare with on-chain hash.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur"
            >
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.body}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
