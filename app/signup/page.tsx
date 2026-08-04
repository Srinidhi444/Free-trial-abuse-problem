// app/signup/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { collectSignals, CollectedSignals } from '@/lib/fingerprint';

type ApiResult = {
  decision: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
  score: number;
  reasons: string[];
  matched: Record<string, boolean>;
};

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [signals, setSignals] = useState<CollectedSignals | null>(null);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const collected = collectSignals();
      setSignals(collected);

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          hardwareFingerprint: collected.hardwareFingerprint,
          browserFingerprint: collected.browserFingerprint,
          webdriver: collected.raw.webdriver,
          cpuCores: collected.raw.cpuCores,
          deviceMemory: collected.raw.deviceMemory,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json();
        setError(errBody.error || 'Signup failed');
        return;
      }

      const data: ApiResult = await res.json();
      setResult(data);
    } catch (err) {
      setError('Something went wrong. Check the console.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    await fetch('/api/reset', { method: 'POST' });
    setResult(null);
    setSignals(null);
    setEmail('');
    setResetting(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-60" />
      <div className="fixed inset-0 bg-vignette" />
      <div className="orb w-[450px] h-[450px] bg-white/8 top-0 right-0 animate-driftSlow" />

      <div className="relative z-10 max-w-xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-white/40 text-sm hover:text-white/80 transition-colors animate-fadeIn"
        >
          &larr; back
        </Link>

        <div className="mt-8 mb-8 animate-fadeInUp">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Start your free trial</h1>
          <p className="text-white/45 text-sm leading-relaxed">
            Signals are collected in your browser and evaluated server-side. No cookies
            or localStorage are read &mdash; identity is derived purely from device signals.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass glass-ring rounded-2xl p-6 space-y-4 animate-scaleIn"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="spinner w-4 h-4" />
                Checking device signals...
              </>
            ) : (
              'Create account & start trial'
            )}
          </button>
        </form>

        {error && (
          <p className="text-white/60 text-sm mt-4 animate-fadeIn">
            <span className="text-white">Error:</span> {error}
          </p>
        )}

        {result && (
          <div className="glass glass-ring rounded-2xl p-6 mt-6 animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-white/70">Server decision</h2>
              <DecisionBadge decision={result.decision} />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                <span>Risk score</span>
                <span className="font-mono text-white/80">{result.score}/100</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            <ul className="space-y-2">
              {result.reasons.map((r, i) => (
                <li
                  key={i}
                  className="text-sm text-white/60 leading-relaxed flex gap-2 animate-fadeIn"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span className="text-white/30 mt-0.5">&bull;</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {signals && (
          <details className="mt-5 text-sm text-white/35 group">
            <summary className="cursor-pointer hover:text-white/60 transition-colors list-none flex items-center gap-1.5">
              <span className="group-open:rotate-90 transition-transform inline-block text-xs">
                &rarr;
              </span>
              View raw collected signals
            </summary>
            <pre className="mt-3 glass rounded-xl p-4 overflow-x-auto text-xs font-mono text-white/50 animate-fadeIn">
              {JSON.stringify(signals, null, 2)}
            </pre>
          </details>
        )}

        <button
          onClick={handleReset}
          disabled={resetting}
          className="mt-10 text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-4 disabled:opacity-50"
        >
          {resetting ? 'Resetting...' : 'Reset demo store'}
        </button>
      </div>
    </main>
  );
}

function DecisionBadge({ decision }: { decision: 'ALLOW' | 'CHALLENGE' | 'BLOCK' }) {
  const styles: Record<string, string> = {
    ALLOW: 'bg-white text-black',
    CHALLENGE: 'bg-white/15 text-white border border-white/25',
    BLOCK: 'bg-transparent text-white/80 border border-white/30',
  };
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full tracking-wide ${styles[decision]}`}
    >
      {decision}
    </span>
  );
}