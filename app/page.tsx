// app/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 bg-grid opacity-60" />
      <div className="fixed inset-0 bg-vignette" />
      <div className="orb w-[500px] h-[500px] bg-white/10 -top-40 -left-40 animate-driftSlow" />
      <div className="orb w-[400px] h-[400px] bg-white/5 top-1/3 -right-32 animate-drift" />

      {/* Nav */}
      <nav className="relative z-10 max-w-5xl mx-auto px-6 pt-8 flex items-center justify-between animate-fadeIn">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">TG</span>
          </div>
          <span className="font-semibold tracking-tight">TrialGuard</span>
        </div>
        <Link
          href="/signup"
          className="btn-ghost text-sm px-4 py-2 rounded-full"
        >
          Sign up
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">
        

        <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] tracking-tight mb-6 animate-fadeInUp">
          One device.
          <br />
          <span className="text-gradient">One trial. No exceptions.</span>
        </h1>

        <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-xl mx-auto animate-fadeInUp stagger-1">
          A working demo of a server-side risk engine that scores every signup on
          device fingerprint, network behavior, and identity signals &mdash; then
          decides to allow, challenge, or block it.
        </p>

        <div className="flex items-center justify-center gap-3 animate-fadeInUp stagger-2">
          <Link
            href="/signup"
            className="btn-primary px-6 py-3 rounded-full font-semibold text-sm"
          >
            Start free trial &rarr;
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Feature
            index="01"
            title="Hardware fingerprint"
            desc="GPU, CPU cores, screen, timezone — survives cookie clears, incognito mode, and even switching browsers."
            delay="stagger-1"
          />
          <Feature
            index="02"
            title="Risk scoring"
            desc="No single signal blocks you. Reused devices, IP velocity, disposable emails, and automation each add weighted points."
            delay="stagger-2"
          />
          <Feature
            index="03"
            title="Tiered decisions"
            desc="Low risk activates instantly. Medium risk gets flagged for review. High risk is blocked before it ever starts."
            delay="stagger-3"
          />
        </div>
      </section>

      {/* Divider + footer note */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="divider-fade mb-8" />
        <p className="text-white/30 text-sm text-center pb-16">
          Try signing up twice from the same browser with different emails to watch
          the second attempt get flagged in real time.
        </p>
      </div>
    </main>
  );
}

function Feature({
  index,
  title,
  desc,
  delay,
}: {
  index: string;
  title: string;
  desc: string;
  delay: string;
}) {
  return (
    <div
      className={`glass glass-hover glass-ring rounded-2xl p-6 animate-fadeInUp ${delay}`}
    >
      <span className="text-white/30 text-xs font-mono tracking-widest">{index}</span>
      <h3 className="font-semibold mt-3 mb-2">{title}</h3>
      <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}