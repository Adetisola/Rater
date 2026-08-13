import 'server-only';
import { globalLogger } from '@/lib/logger';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendTransactionalEmailOptions {
  to: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
}

/**
 * Sends a transactional email via the Brevo REST API.
 *
 * - Server-only: protected by `import 'server-only'`
 * - Never exposes the API key in logs or responses
 * - Throws on Brevo API errors so callers can catch and handle gracefully
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  tags,
}: SendTransactionalEmailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    globalLogger.warn('[Email] BREVO_API_KEY is not configured — skipping email send', {
      recipient: to.email,
      subject,
    });
    return;
  }

  const payload: Record<string, unknown> = {
    sender: {
      name: 'Rater',
      email: 'hello@raterapp.site',
    },
    to: [{ email: to.email, name: to.name ?? to.email }],
    subject,
    htmlContent: html,
  };

  if (text) {
    payload.textContent = text;
  }

  if (tags && tags.length > 0) {
    payload.tags = tags;
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
    // Reasonable timeout via AbortSignal — prevents Vercel function from hanging
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Log status but never log the API key
    const responseText = await response.text().catch(() => '(unreadable)');
    globalLogger.error('[Email] Brevo API returned a non-2xx response', {
      status: response.status,
      recipient: to.email,
      subject,
      brevoResponse: responseText.slice(0, 500), // truncate, never log secrets
    });
    throw new Error(`Brevo API error: ${response.status}`);
  }

  globalLogger.info('[Email] Transactional email sent successfully', {
    recipient: to.email,
    subject,
    tags,
  });
}
