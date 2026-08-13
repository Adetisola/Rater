/**
 * Supabase Database Webhook — /api/webhooks/supabase
 *
 * Receives Supabase database events (INSERT/UPDATE/DELETE) and triggers
 * the appropriate Rater email event.
 *
 * Security: Verified via the `x-webhook-secret` request header.
 * This is intentionally different from the Algolia webhook's query-param
 * approach — headers are not captured in server access logs or proxy logs.
 *
 * Current triggers:
 *   - profiles INSERT → WELCOME_USER email
 *
 * Reliability notes:
 *   - Supabase webhooks provide at-least-once delivery.
 *   - This endpoint always returns 200 after validation to prevent
 *     Supabase from retrying on transient email failures.
 *   - Email sending is awaited (not fire-and-forget) to give the
 *     Brevo request a reliable opportunity to complete within the
 *     Vercel function lifetime.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendWelcomeEmail } from '@/lib/email/events';
import { globalLogger } from '@/lib/logger';

function safeCompare(a: string, b: string): boolean {
  // Length-mismatch check prevents timing attack on unequal-length strings
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: Request) {
  // 1. Authenticate via header (safer than query param — not captured in access logs)
  const incomingSecret = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!incomingSecret || !expectedSecret || !safeCompare(incomingSecret, expectedSecret)) {
    globalLogger.warn('[Webhook/Supabase] Unauthorized request — invalid or missing x-webhook-secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: {
    type: string;
    table: string;
    record: Record<string, unknown>;
    old_record: Record<string, unknown> | null;
  };

  try {
    payload = await req.json();
  } catch {
    globalLogger.warn('[Webhook/Supabase] Invalid JSON payload');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, table, record } = payload;

  // 2. Route: profiles INSERT → WELCOME_USER
  if (table === 'profiles' && type === 'INSERT') {
    const email = typeof record.email === 'string' ? record.email : null;
    const name = typeof record.name === 'string' ? record.name : '';

    if (!email) {
      globalLogger.warn('[Webhook/Supabase] profiles INSERT received but record.email is missing', {
        userId: record.id,
      });
      // Still return 200 — this isn't an error we can retry our way out of
      return NextResponse.json({ ok: true, message: 'No email on record — skipped' });
    }

    // Awaited — gives the Brevo request a full opportunity to complete
    // within the Vercel function lifetime. sendWelcomeEmail() never throws.
    await sendWelcomeEmail(email, name);

    globalLogger.info('[Webhook/Supabase] WELCOME_USER triggered', { userId: record.id });
    return NextResponse.json({ ok: true, message: 'WELCOME_USER triggered' });
  }

  // 3. Unknown event — acknowledge and ignore
  return NextResponse.json({ ok: true, message: 'Event not handled' });
}
