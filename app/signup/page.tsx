'use client';

import { useState } from 'react';
import Link from 'next/link';
import { collectSignals, CollectedSignals } from '../../lib/fingerprint';

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
    await fetch('/api/reset', { method: 'POST' });
    setResult(null);
    setSignals(null);
    setEmail('');
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <Link href="/" className="text-slate-400 text-sm hover:text-slate-200">
        &larr; back
      </Link>

      <h1 className="text-3xl font-bold mt-6 mb-2">Start your free trial</h1>
      <p className="text-slate-400 mb-8">
        Signals are collected in your browser and evaluated server-side. Nothing here reads
        cookies or localStorage &mdash; the identity is derived from device signals.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold py-2.5 rounded-lg transition"
        >
          {loading ? 'Checking device signals...' : 'Create account & start trial'}
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {result && (
        <div className="mt-8 border border-slate-800 rounded-xl p-5 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Server decision</h2>
            <DecisionBadge decision={result.decision} />
          </div>

          <p className="text-sm text-slate-400 mb-3">
            Risk score: <span className="font-mono text-slate-200">{result.score}/100</span>
          </p>

          <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
            {result.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {signals && (
        <details className="mt-6 text-sm text-slate-500">
          <summary className="cursor-pointer hover:text-slate-300">
            View raw collected signals (debug)
          </summary>
          <pre className="mt-2 bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(signals, null, 2)}
          </pre>
        </details>
      )}

      <button
        onClick={handleReset}
        className="mt-10 text-xs text-slate-500 hover:text-slate-300 underline"
      >
        Reset demo store (clears all recorded devices/emails)
      </button>
    </main>
  );
}

function DecisionBadge({ decision }: { decision: 'ALLOW' | 'CHALLENGE' | 'BLOCK' }) {
  const styles: Record<string, string> = {
    ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    CHALLENGE: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    BLOCK: 'bg-red-500/20 text-red-400 border-red-500/40',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[decision]}`}>
      {decision}
    </span>
  );
}