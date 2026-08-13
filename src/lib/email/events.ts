/**
 * Rater Email Events
 *
 * Central interface for transactional email triggers.
 * Each exported function represents one email event.
 * Keeps event logic separate from low-level Brevo delivery.
 *
 * Current events:
 *   - WELCOME_USER: Sent once when a new user profile is created.
 *
 * Future events (not yet implemented):
 *   - FIRST_REVIEW, FIRST_POST, ACHIEVEMENT_UNLOCKED, TOP_RATED, PRODUCT_ANNOUNCEMENT
 */

import { sendTransactionalEmail } from './brevo';
import { welcomeEmail } from './templates';
import { globalLogger } from '@/lib/logger';

// ─── WELCOME_USER ─────────────────────────────────────────────────────────────

/**
 * Sends the welcome email to a newly registered Rater user.
 *
 * - Never throws — email failure is caught and logged so it cannot block signup.
 * - At-least-once delivery (Supabase webhook trigger); duplicates are unlikely
 *   but not formally prevented in V1. A future email_events table can add
 *   idempotency if needed.
 *
 * @param email - The user's email address
 * @param name  - The user's display name (used as firstName; falls back to "there")
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  try {
    const { subject, html, text } = welcomeEmail({ firstName: name, email });

    await sendTransactionalEmail({
      to: { email, name },
      subject,
      html,
      text,
      tags: ['welcome', 'transactional'],
    });
  } catch (error) {
    // Log the failure but never re-throw — account creation must not be affected
    globalLogger.error('[Email] Failed to send WELCOME_USER email', {
      recipient: email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
