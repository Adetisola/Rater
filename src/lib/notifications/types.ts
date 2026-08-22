/**
 * Internal Notification Engine & Registry Types
 */

import type { NotificationCategory, NotificationEventType } from '@/types';

export interface NotificationEventPayload {
  recipientProfileId: string;
  actorProfileId?: string | null;
  targetEntityId?: string | null;
  feedbackRequestId?: string | null;
  idempotencyKey: string;
  groupKey?: string | null;
  metadata?: Record<string, any>;
}

export interface RenderedNotificationCopy {
  title: string;
  message: string;
  pushTitle?: string;
  pushBody?: string;
  emailSubject?: string;
  actionLabel: string;
  actionUrl: string;
}

export interface NotificationEventDefinition {
  type: NotificationEventType;
  category: NotificationCategory;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  preferenceKey?: 'notify_critiques' | 'notify_milestones' | 'notify_insights';
  renderCopy: (data: {
    actorName?: string;
    workTitle?: string;
    postId?: string;
    reviewId?: string;
    badgeId?: string;
    feedbackTitle?: string;
    feedbackSlug?: string;
    metadata?: Record<string, any>;
  }) => RenderedNotificationCopy;
}

export interface NormalizedNotificationEvent {
  eventType: NotificationEventType;
  recipientProfileId: string;
  actorProfileId?: string | null;
  targetEntityId?: string | null;
  feedbackRequestId?: string | null;
  idempotencyKey: string;
  groupKey?: string | null;
  metadata?: Record<string, any>;
}
