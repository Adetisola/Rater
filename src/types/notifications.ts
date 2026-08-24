/**
 * Notification Domain Type Definitions
 *
 * Central types for Rater's notification system (In-App, Web Push, Brevo Email).
 */

export type NotificationCategory = 'activity' | 'milestones' | 'insights' | 'community' | 'system';

export type NotificationEventType =
  | 'FIRST_CRITIQUE_RECEIVED'
  | 'CRITIQUE_RECEIVED'
  | 'WORK_RATING_UNLOCKED'
  | 'INSIGHTS_READY'
  | 'BADGE_TOP_RATED_AWARDED'
  | 'FIRST_WORK_PUBLISHED'
  | 'NEW_WORK_PUBLISHED'
  | 'FEEDBACK_REQUEST_REPLY'
  | 'FEEDBACK_STATUS_CHANGED'
  | 'FEEDBACK_COMMENT_RECEIVED'
  | 'ACCOUNT_SUSPENDED';

export interface NotificationActor {
  id: string;
  name: string;
  username: string;
  avatar_url?: string | null;
}

export interface NotificationPostSummary {
  id: string;
  title: string;
  image_url?: string;
  category?: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  actor_id: string | null;
  type: NotificationEventType | string;
  category: NotificationCategory;
  title: string;
  message: string;
  action_label: string;
  action_url: string;
  post_id: string | null;
  feedback_request_id: string | null;
  idempotency_key: string;
  group_key: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  // Joined relation fields populated on fetch
  actor?: NotificationActor | null;
  post?: NotificationPostSummary | null;
}

export interface NotificationPreferences {
  id: string;
  profile_id: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  notify_critiques: boolean;
  notify_milestones: boolean;
  notify_insights: boolean;
  notify_feedback_status: boolean;
  notify_feedback_comments: boolean;
  notify_new_work: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionRecord {
  id: string;
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
}
