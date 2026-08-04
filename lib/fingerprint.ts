// lib/fingerprint.ts
// Client-side signal collector. Runs only in the browser.
//
// Produces TWO separate identities on purpose:
//  - hardwareFingerprint: signals tied to the physical machine (GPU, CPU cores, screen,
//    device memory, timezone, platform) -> survives cookie clears, incognito mode, and
//    even switching browsers on the same machine.
//  - browserFingerprint: signals tied to the specific browser engine (canvas/audio
//    rendering quirks, user agent, plugin count) -> catches same-browser repeats but
//    drifts across browsers/updates.
//
// Keeping these separate lets the server reason about collisions/divisions independently
// instead of trusting one brittle combined hash (the naive "brute-force" approach).

export interface CollectedSignals {
  hardwareFingerprint: string;
  browserFingerprint: string;
  raw: {
    gpu: string;
    cpuCores: number;
    deviceMemory: number | 'unknown';
    screen: string;
    timezone: string;
    languages: string;
    platform: string;
    canvasHash: string;
    audioHash: string;
    userAgent: string;
    webdriver: boolean;
    pluginsCount: number;
  };
}

function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function getGpuInfo(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return `${vendor}~${renderer}`;
  } catch {
    return 'gpu-error';
  }
}

function getCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('trial-guard-fp-probe', 2, 2);
    ctx.strokeStyle = 'rgba(102, 200, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(50, 15, 10, 0, Math.PI * 2);
    ctx.stroke();
    return fnv1aHash(canvas.toDataURL());
  } catch {
    return 'canvas-error';
  }
}

function getAudioHash(): string {
  try {
    const AudioCtx =
      (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (!AudioCtx) return 'no-audio-ctx';
    const ctx = new AudioCtx(1, 5000, 44100);
    const oscillator = ctx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    const compressor = ctx.createDynamicsCompressor();
    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);
    ctx.startRendering();
    return fnv1aHash(`${ctx.sampleRate}-${oscillator.frequency.value}`);
  } catch {
    return 'audio-error';
  }
}

export function collectSignals(): CollectedSignals {
  const nav = window.navigator as any;
  const gpu = getGpuInfo();
  const cpuCores = nav.hardwareConcurrency || 0;
  const deviceMemory = nav.deviceMemory || 'unknown';
  const screenSig = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  const languages = (nav.languages || [nav.language || 'unknown']).join(',');
  const platform = nav.platform || 'unknown';
  const canvasHash = getCanvasHash();
  const audioHash = getAudioHash();
  const userAgent = nav.userAgent || 'unknown';
  const webdriver = Boolean(nav.webdriver);
  const pluginsCount = nav.plugins ? nav.plugins.length : 0;

  const hardwareFingerprint = fnv1aHash(
    [gpu, cpuCores, deviceMemory, screenSig, timezone, languages, platform].join('|')
  );

  const browserFingerprint = fnv1aHash(
    [hardwareFingerprint, canvasHash, audioHash, userAgent, pluginsCount].join('|')
  );

  return {
    hardwareFingerprint,
    browserFingerprint,
    raw: {
      gpu,
      cpuCores,
      deviceMemory,
      screen: screenSig,
      timezone,
      languages,
      platform,
      canvasHash,
      audioHash,
      userAgent,
      webdriver,
      pluginsCount,
    },
  };
}