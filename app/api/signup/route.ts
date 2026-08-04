import { NextRequest, NextResponse } from 'next/server';
import { evaluateSignup } from '../../../lib/riskEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, hardwareFingerprint, browserFingerprint, webdriver, cpuCores, deviceMemory } = body;

    if (!email || !hardwareFingerprint || !browserFingerprint) {
      return NextResponse.json(
        { error: 'Missing required fields: email, hardwareFingerprint, browserFingerprint' },
        { status: 400 }
      );
    }

    // Server derives IP itself -- never trust a client-supplied IP.
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

    const result = evaluateSignup({
      email: String(email).toLowerCase().trim(),
      hardwareFingerprint,
      browserFingerprint,
      ip,
      webdriver: Boolean(webdriver),
      cpuCores: Number(cpuCores) || 0,
      deviceMemory: deviceMemory === 'unknown' ? 'unknown' : Number(deviceMemory) || 0,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }
}