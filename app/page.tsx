import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center font-bold text-slate-900">
          TG
        </div>
        <span className="font-semibold text-lg">TrialGuard</span>
      </div>

      <h1 className="text-4xl font-bold leading-tight mb-4">
        One device. One trial. <span className="text-emerald-400">No exceptions.</span>
      </h1>
      <p className="text-slate-400 text-lg mb-8">
        This is a working demo of a multi-signal risk engine that decides whether a signup
        gets a fresh 14-day trial, needs extra verification, or gets blocked outright &mdash;
        without relying on cookies or IP blocks alone.
      </p>

      <Link
        href="/signup"
        className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-6 py-3 rounded-lg transition"
      >
        Start free trial &rarr;
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
        <Feature
          title="Hardware fingerprint"
          desc="GPU, CPU cores, screen, timezone -- survives cookie clears and incognito mode."
        />
        <Feature
          title="Risk scoring"
          desc="No single signal blocks you. Reused device, IP velocity, disposable email, and automation all add weighted points."
        />
        <Feature
          title="Tiered decisions"
          desc="Low risk -> instant trial. Medium -> manual review notice. High -> blocked."
        />
      </div>

      <p className="text-slate-500 text-sm mt-16">
        Try signing up twice from this same browser/device with different emails to see the
        second attempt get flagged.
      </p>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/50">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{desc}</p>
    </div>
  );
}