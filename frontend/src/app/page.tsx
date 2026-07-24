import Link from "next/link";

const steps = [
  {
    step: "01",
    title: "Design with your brand",
    body: "Upload background, logo, signature, and stamp. No generic templates forced on you.",
  },
  {
    step: "02",
    title: "Issue & hash",
    body: "Generate a PDF, embed a verify QR, and compute SHA-256 from the final file bytes.",
  },
  {
    step: "03",
    title: "Anchor on-chain",
    body: "Publish only the hash to a smart contract — never the PDF itself.",
  },
  {
    step: "04",
    title: "Anyone can verify",
    body: "Scan the QR or enter a Certificate ID. We recompute the hash and compare on-chain.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.1),_transparent_36%)]" />

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

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-14 md:pt-20">
        <section className="max-w-3xl">
          <p className="text-sm font-medium text-blue-600">
            Proof of authenticity for modern issuers
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
            Certificates you can prove — without putting PDFs on-chain.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Issue branded digital certificates, store only the SHA-256 hash on an
            EVM smart contract, and let anyone verify authenticity via Certificate
            ID or QR code.
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
              body: "Blockchain stores certificate ID, hash, issuer wallet, and timestamp — never the PDF file.",
            },
            {
              title: "Your visual identity",
              body: "Upload your own template, logo, signature, and stamp. Keep every certificate on-brand.",
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
            <p className="mt-2 text-sm text-slate-500">
              A clean issuer flow designed for demos, portfolios, and real
              verification needs.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {steps.map((item) => (
              <article key={item.step} className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-blue-600">
                  {item.step}
                </p>
                <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative border-t border-slate-200/80 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500">
          <p>© 2026 Primordial Studio · CertChain</p>
          <div className="flex gap-4">
            <Link href="/verify" className="hover:text-slate-800">
              Verify
            </Link>
            <Link href="/login" className="hover:text-slate-800">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
