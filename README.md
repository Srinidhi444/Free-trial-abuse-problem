TrialGuard — Multi-Signal Free Trial Abuse Prevention Demo
A working Next.js application that demonstrates how production systems (Stripe
Radar, Fingerprint, YouTube Premium, etc.) enforce **"one trial per
device/person"** rules — without relying on cookies or IP blocks alone.

This is a teaching-scale implementation of a real risk-scoring architecture:
collect device signals in the browser, send them to a server that has never
trusted the client, score them against a weighted rule set, and return a
tiered decision (ALLOW / CHALLENGE / BLOCK) instead of a binary gate.

1. The Problem
Given a new signup, decide whether this physical device/user has already
consumed a free trial — without requiring login upfront, and without
blocking legitimate users who happen to share a network or device.

Naive approaches fail for specific, well-understood reasons:

Approach	Why it fails
Cookie / localStorage flag	Lives entirely in client-controlled storage. One click on "clear browsing data," or incognito mode, resets it for free.
IP-address blocking	Shared networks (offices, campuses, mobile carriers) cause false positives; VPNs/proxies let real abusers rotate IPs for free.
Single combined fingerprint hash	Browser-engine-specific signals (canvas, audio rendering) change across browsers on the same machine, so switching browsers looks like a "new device." Static fingerprints also drift with OS/browser updates and collide across similar hardware.
The fix used here is a multi-signal, server-authoritative risk score with
a tiered response — the same shape used by Stripe Radar, Fingerprint, and
similar production fraud systems.

2. Project Structure
text
trial-guard-demo/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── lib/
│   ├── fingerprint.ts      # client-side signal collection
│   └── riskEngine.ts       # server-side scoring algorithm (the core logic)
└── app/
    ├── layout.tsx
    ├── globals.css
    ├── page.tsx             # landing page
    ├── signup/
    │   └── page.tsx          # signup form + live decision UI
    └── api/
        ├── signup/
        │   └── route.ts       # POST /api/signup — runs the risk engine
        └── reset/
            └── route.ts       # POST /api/reset  — clears the in-memory store (dev only)
3. Setup

Clone the repository, install dependencies, and start the development server:

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

4. Architecture: Client Collects, Server Decides
This is the single most important design principle in the whole system.
Client-side JavaScript is always inspectable and patchable, so **no trust
decision is ever made in the browser** — the browser's only job is to
gather raw signals; the server's only job is to score them.

4.1 lib/fingerprint.ts — signal collection
Runs only in the browser (inside a 'use client' component). It builds
two separate identifiers on purpose:

hardwareFingerprint — hash of GPU/WebGL renderer string, CPU core
count, device memory, screen resolution, timezone, language list, and
platform. These are physical-machine properties, so this hash survives
cookie clears, incognito mode, and switching browsers on the same machine.

browserFingerprint — hash of the hardware fingerprint plus
canvas-rendering hash, audio-rendering hash, user agent, and plugin count.
These are browser-engine-specific and will differ across browsers even on
identical hardware, or drift after a major browser update.

Keeping them separate lets the server reason about "same device, different
browser" and "same browser, still lying" independently, rather than trusting
one brittle combined hash.

Signal collection functions:

Function	Signal captured
getGpuInfo()	WebGL UNMASKED_VENDOR_WEBGL / UNMASKED_RENDERER_WEBGL
getCanvasHash()	Hash of a 2D canvas rendering a fixed shape/text
getAudioHash()	Hash of an OfflineAudioContext oscillator render
collectSignals()	Combines all of the above plus navigator properties into both fingerprints
4.2 lib/riskEngine.ts — the scoring algorithm
This is the core logic, and it runs server-only.

Storage (TrialStore) — an in-memory lookup table indexed three ways:
by hardwareFingerprint, by browserFingerprint, and by IP with rolling
timestamps. In production this would be a Postgres table or Redis hash so it
survives restarts and scales across instances; the scoring logic doesn't
change either way.

Detection helpers:

isDisposableEmail() — checks the email domain against a blocklist
(mailinator.com, tempmail.com, etc.)

hasInconsistentHardwareSignals() — flags signals that look artificial
(0 CPU cores or 0 device memory almost never happens on a real device;
it's a sign the fingerprint was faked by a script)

evaluateSignup() — the weighted scoring core. Every signal adds points
instead of acting as a hard veto, which is what makes this "optimal" versus
the naive brute-force approaches:

Signal	Points	Rationale
hardwareFingerprint already in store	+60	Strongest signal — same physical machine already had a trial, regardless of which account/email is used
browserFingerprint already in store (and hardware didn't already match)	+35	Weaker on its own since it drifts across browsers/updates; skipped if hardware already flagged to avoid double-counting
IP has >3 signups in the last 10 minutes	+20	Catches burst/bot signups; weighted low because shared networks cause false positives
Disposable/temp email domain	+25	Cheap for an abuser to defeat alone, so it's a contributor, not a blocker
navigator.webdriver === true	+40	Strong indicator of a scripted/headless signup bot
Zero CPU cores or zero device memory	+15	Minor supporting signal that the fingerprint itself looks spoofed
Score is capped at 100 and mapped to a tiered decision:

score < 30 → ALLOW

30 ≤ score < 60 → CHALLENGE

score ≥ 60 → BLOCK

Tiering matters because a single medium-risk signal should never outright
block a real user, but stacking two or three pushes the score past the
threshold. Only non-BLOCKed signups get written into the store, so a
blocked attacker's fingerprint doesn't pollute the record with a phantom
account.

4.3 app/api/signup/route.ts — the server endpoint
Reads the client's JSON body (email + both fingerprints + a few raw values)
but derives the IP itself from the x-forwarded-for request header
rather than trusting any IP the client might claim — a client can lie about
its own IP in a payload, but it can't fake the header the server actually
received the request on. It then calls evaluateSignup() and returns the
verdict as JSON.

4.4 app/api/reset/route.ts
A dev-only convenience route that empties the in-memory store so you can
re-run test scenarios without restarting the server.

4.5 UI — app/page.tsx and app/signup/page.tsx
Landing page: static copy on the three pillars (hardware fingerprint,
risk scoring, tiered decisions) with a CTA into /signup.

Signup page: a client component (needs canvas/WebGL/navigator APIs).
On submit it calls collectSignals(), POSTs to /api/signup, and renders
the returned decision as a color-coded badge, the numeric score, and
the human-readable reasons array so you can see exactly which signals
fired. A collapsible section shows the raw fingerprint JSON for debugging.

5. Request Flow End-to-End
Load /signup — no signals collected yet.

Submit the form — collectSignals() runs in the browser, producing both
fingerprints.

POST to /api/signup — server extracts the real IP from headers.

evaluateSignup() checks the store for fingerprint matches, disposable
email, IP velocity, and automation flags; sums weighted points; decides
ALLOW / CHALLENGE / BLOCK; inserts a new record if not blocked.

Decision, score, and reasons flow back to the UI and render immediately.

6. Testing Scenarios
#	Action	Expected result
1	Sign up with a fresh email, e.g. test1@gmail.com	ALLOW, score near 0
2	On the same browser, sign up again with a different email, e.g. test2@gmail.com	CHALLENGE/BLOCK — hardware fingerprint already matches record #1
3	Sign up with test3@mailinator.com	+25 points for disposable email, stacking with any device reuse
4	Open the signup page in a different real browser on the same machine (e.g. Firefox after Chrome)	hardwareFingerprint still matches (same GPU/CPU/screen/timezone) even though browserFingerprint differs — proves the hardware-bound signal survives browser switching, and by extension, survives switching Google accounts on the same device
5	Click Reset demo store	Clears all in-memory records; start over
7. What This Demonstrates vs. Real Production Systems
Aspect	This demo	Stripe Radar / Fingerprint (production)
Aspect	This demo	Stripe Radar / Fingerprint (production)
Signal count	~7 device signals	~1,200+ device signals per session
Storage	In-memory Map, resets on server restart	Persistent DB + cross-network reputation graph
Scope of reputation	Only your own site's signups	Shared across the entire payment/fraud network
Trigger point	At account signup	Often deferred to the payment-instrument step (card attached), which is the strongest signal
CHALLENGE tier	Cosmetic only — trial still activates	Real step-up friction: OTP, $0/$1 card auth hold, document verification, delayed activation
Behavioral signals	None	Tracks post-signup behavior (e.g. jumping straight to high-value features looks bot-like)
The CHALLENGE tier in this demo is intentionally left as a placeholder —
in a real system it would gate trial activation behind an additional step
(SMS OTP, card authorization hold, or a manual review queue) rather than
letting the signup through automatically.