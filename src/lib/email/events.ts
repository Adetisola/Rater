/**
 * Rater Email Events
 *
 * Central interface for transactional email triggers.
 * Keeps event logic separate from low-level Brevo delivery.
 */

import { sendTransactionalEmail } from './brevo';
import { 
  welcomeEmail, 
  ratingUnlockedEmail, 
  insightsReadyEmail, 
  topRatedEmail,
  notificationGenericEmail 
} from './templates';
import { globalLogger } from '@/lib/logger';
import type { NotificationEventType } from '@/types';

// ─── WELCOME_USER ─────────────────────────────────────────────────────────────

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
    globalLogger.error('[Email] Failed to send WELCOME_USER email', {
      recipient: email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ─── NOTIFICATION EMAIL DISPATCH ──────────────────────────────────────────────

export interface SendNotificationEmailParams {
  eventType: NotificationEventType | string;
  toEmail: string;
  toName: string;
  subject?: string;
  workTitle?: string;
  actionUrl: string;
  actionLabel?: string;
}

export async function sendNotificationEmail({
  eventType,
  toEmail,
  toName,
  subject: customSubject,
  workTitle,
  actionUrl,
  actionLabel,
}: SendNotificationEmailParams): Promise<void> {
  try {
    let emailData: { subject: string; html: string; text: string };

    switch (eventType) {
      case 'WORK_RATING_UNLOCKED':
        emailData = ratingUnlockedEmail({
          firstName: toName,
          workTitle,
          actionUrl,
        });
        break;

      case 'INSIGHTS_READY':
        emailData = insightsReadyEmail({
          firstName: toName,
          workTitle,
          actionUrl,
        });
        break;

      case 'BADGE_TOP_RATED_AWARDED':
        emailData = topRatedEmail({
          firstName: toName,
          workTitle,
          actionUrl,
        });
        break;

      default:
        emailData = notificationGenericEmail({
          firstName: toName,
          title: customSubject || 'Update on Rater',
          message: workTitle ? `Regarding your Work "${workTitle}".` : 'You have a new update in the Studio.',
          actionLabel,
          actionUrl,
        });
        break;
    }

    await sendTransactionalEmail({
      to: { email: toEmail, name: toName },
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      tags: ['notification', eventType.toLowerCase(), 'transactional'],
    });
  } catch (error) {
    globalLogger.error('[Email] Failed to send notification email', {
      recipient: toEmail,
      eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
