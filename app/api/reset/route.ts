// app/api/reset/route.ts
// Dev-only helper endpoint to clear the in-memory store so you can re-run the demo.
import { NextResponse } from 'next/server';
import { store } from '../../../lib/riskEngine';

export async function POST() {
  store.reset();
  return NextResponse.json({ ok: true });
}