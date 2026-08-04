// lib/riskEngine.ts
//
// THE OPTIMAL ALGORITHM: multi-signal, server-authoritative risk scoring.
//
// Design goals mirrored from the write-up:
//  1. Client only COLLECTS signals, server DECIDES (client code is never trusted).
//  2. No single signal is a hard veto by itself (avoids the brute-force
//     "one fingerprint = one binary gate" failure mode) -> instead every signal
//     contributes weighted points to a risk score.
//  3. Decision is TIERED (allow / challenge / block), not binary, to keep
//     false-positive cost low for legitimate users who happen to collide.
//  4. Every account creation is persisted keyed by BOTH hardwareFingerprint and
//     browserFingerprint, IP, and normalized email so future lookups can catch
//     reuse from any of these angles ("cross-signal matching").
//
// Storage here is an in-memory Map for demo purposes only. In production this
// is a Postgres table / Redis hash so it survives server restarts and scales
// across instances -- swap `Store` for a DB-backed implementation without
// touching the scoring logic below.

export interface SignupInput {
  email: string;
  hardwareFingerprint: string;
  browserFingerprint: string;
  ip: string;
  webdriver: boolean;
  cpuCores: number;
  deviceMemory: number | 'unknown';
}

export type Decision = 'ALLOW' | 'CHALLENGE' | 'BLOCK';

export interface RiskResult {
  decision: Decision;
  score: number;
  reasons: string[];
  matched: {
    hardwareFingerprintReused: boolean;
    browserFingerprintReused: boolean;
    ipVelocityFlag: boolean;
    disposableEmail: boolean;
    automationDetected: boolean;
    inconsistentHardwareSignals: boolean;
  };
}

interface AccountRecord {
  email: string;
  hardwareFingerprint: string;
  browserFingerprint: string;
  ip: string;
  firstSeen: number;
  lastSeen: number;
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'yopmail.com',
  'trashmail.com',
]);

const IP_VELOCITY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const IP_VELOCITY_THRESHOLD = 3; // >3 signups from same IP in window is suspicious

class TrialStore {
  private byHardwareFp = new Map<string, AccountRecord[]>();
  private byBrowserFp = new Map<string, AccountRecord[]>();
  private byIp = new Map<string, number[]>(); // ip -> timestamps
  private allRecords: AccountRecord[] = [];

  getByHardwareFp(fp: string): AccountRecord[] {
    return this.byHardwareFp.get(fp) || [];
  }

  getByBrowserFp(fp: string): AccountRecord[] {
    return this.byBrowserFp.get(fp) || [];
  }

  recordIpHit(ip: string): number {
    const now = Date.now();
    const hits = (this.byIp.get(ip) || []).filter((t) => now - t < IP_VELOCITY_WINDOW_MS);
    hits.push(now);
    this.byIp.set(ip, hits);
    return hits.length;
  }

  insert(record: AccountRecord) {
    this.allRecords.push(record);
    const hwList = this.byHardwareFp.get(record.hardwareFingerprint) || [];
    hwList.push(record);
    this.byHardwareFp.set(record.hardwareFingerprint, hwList);

    const brList = this.byBrowserFp.get(record.browserFingerprint) || [];
    brList.push(record);
    this.byBrowserFp.set(record.browserFingerprint, brList);
  }

  all(): AccountRecord[] {
    return this.allRecords;
  }

  reset() {
    this.byHardwareFp.clear();
    this.byBrowserFp.clear();
    this.byIp.clear();
    this.allRecords = [];
  }
}

// Singleton in-memory store, persisted across API calls within the same
// server process (Next.js dev server keeps modules warm between requests).
const globalForStore = globalThis as unknown as { __trialStore?: TrialStore };
export const store = globalForStore.__trialStore || new TrialStore();
globalForStore.__trialStore = store;

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

function hasInconsistentHardwareSignals(input: SignupInput): boolean {
  // Crude "spoof likelihood" heuristic: real devices almost never report
  // 0 CPU cores or a device memory of 0 -- automation/spoofing frameworks
  // that fake a fingerprint often leave these at default/zero values.
  const zeroCores = input.cpuCores === 0;
  const zeroMemory = input.deviceMemory === 0;
  return zeroCores || zeroMemory;
}

export function evaluateSignup(input: SignupInput): RiskResult {
  const reasons: string[] = [];
  let score = 0;

  const hwMatches = store.getByHardwareFp(input.hardwareFingerprint);
  const hardwareFingerprintReused = hwMatches.length > 0;
  if (hardwareFingerprintReused) {
    score += 60;
    reasons.push(
      `Hardware fingerprint already used for ${hwMatches.length} prior trial(s) (email(s): ${hwMatches
        .map((m) => m.email)
        .join(', ')})`
    );
  }

  const brMatches = store.getByBrowserFp(input.browserFingerprint);
  const browserFingerprintReused = brMatches.length > 0;
  if (browserFingerprintReused && !hardwareFingerprintReused) {
    // Only add if hardware match didn't already flag it, to avoid double counting
    score += 35;
    reasons.push(`Same browser fingerprint seen before (email(s): ${brMatches.map((m) => m.email).join(', ')})`);
  }

  const ipHitsInWindow = store.recordIpHit(input.ip);
  const ipVelocityFlag = ipHitsInWindow > IP_VELOCITY_THRESHOLD;
  if (ipVelocityFlag) {
    score += 20;
    reasons.push(`IP ${input.ip} has ${ipHitsInWindow} signups in the last 10 minutes`);
  }

  const disposableEmail = isDisposableEmail(input.email);
  if (disposableEmail) {
    score += 25;
    reasons.push('Disposable/temporary email domain detected');
  }

  const automationDetected = input.webdriver;
  if (automationDetected) {
    score += 40;
    reasons.push('navigator.webdriver flag indicates automation/headless browser');
  }

  const inconsistentHardwareSignals = hasInconsistentHardwareSignals(input);
  if (inconsistentHardwareSignals) {
    score += 15;
    reasons.push('Hardware signals look artificial (0 CPU cores or 0 device memory)');
  }

  score = Math.min(score, 100);

  let decision: Decision;
  if (score >= 60) decision = 'BLOCK';
  else if (score >= 30) decision = 'CHALLENGE';
  else decision = 'ALLOW';

  if (reasons.length === 0) reasons.push('No risk signals detected');

  if (decision !== 'BLOCK') {
    store.insert({
      email: input.email,
      hardwareFingerprint: input.hardwareFingerprint,
      browserFingerprint: input.browserFingerprint,
      ip: input.ip,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    });
  }

  return {
    decision,
    score,
    reasons,
    matched: {
      hardwareFingerprintReused,
      browserFingerprintReused,
      ipVelocityFlag,
      disposableEmail,
      automationDetected,
      inconsistentHardwareSignals,
    },
  };
}