/**
 * Centralized type definitions for the Rater platform.
 *
 * All domain types live here so they can be imported from '@/types'
 * by any layer (components, hooks, logic, utils) without creating
 * circular dependencies.
 */

import type { SocialLink } from '../utils/socialLinksUtils';

// ─── AI Tools ─────────────────────────────────────────────────────────────────

export const AI_TOOLS = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'google-flow', label: 'Google Flow' },
  { id: 'midjourney', label: 'Midjourney' },
  { id: 'stable-diffusion', label: 'Stable Diffusion' },
  { id: 'leonardo', label: 'Leonardo AI' },
  { id: 'flux', label: 'Flux' },
  { id: 'ideogram', label: 'Ideogram' },
  { id: 'dalle', label: 'DALL·E' },
  { id: 'nano-banana', label: 'Nano Banana' },
  { id: 'other', label: 'Other' },
] as const;

export type AiToolId = typeof AI_TOOLS[number]['id'];

// ─── Categories ───────────────────────────────────────────────────────────────

export type Category =
  | 'Web Design'
  | 'Mobile App Design'
  | 'Brand Identity Design'
  | 'Mockup Design'
  | 'Logo Design'
  | 'Poster Design'
  | 'Flyer Design'
  | 'Social Media Design'
  | 'AI Image'
  | '3D Design'
  | 'Packaging Design'
  | 'Banner Design'
  | 'Ad Creative Design'
  | 'Illustration'
  | 'Icon Design'
  | 'Typography Design'
  | 'UI Design'
  | 'Landing Page Design'
  | 'Dashboard Design';

// ─── Avatar / User ────────────────────────────────────────────────────────────

export interface Avatar {
  id: string;
  username: string;                  // UNIQUE public handle (URL slug)
  email: string;                     // UNIQUE email address
  show_email?: boolean;              // User preference to show email publicly
  name: string;                      // Display name (flexible)
  role: string | null;               // public-facing identity label (nullable)
  avatar_url?: string;
  bg_color?: string;
  is_admin?: boolean;
  bio?: string;
  is_blocked: boolean;
  created_at: string;
  // Username history — for old-URL redirects and Supabase migration
  username_last_changed_at?: string | null;    // ISO timestamp of last username change
  previous_usernames?: string[];      // Ordered list of past usernames (oldest first)
  social_links?: SocialLink[];
  onboarding_completed?: boolean;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  post_id: string;
  reviewer_id: string;
  reviewer_name?: string;
  ratings: Record<string, number>;

  comment?: string;
  created_at: string;
  updated_at?: string;
}

// ─── Media & Posts ─────────────────────────────────────────────────────────────

export interface MediaAsset {
  id: string;
  type: 'image' | 'video'; // Future-proofing
  url: string;
  public_id: string;
  width: number;
  height: number;
  aspect_ratio: number;
  format: string;
  bytes: number;
  alt?: string;
  order: number;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: Category;
  image_url: string; // Kept for backwards-compatibility during migration
  media?: MediaAsset[]; // The new robust media architecture
  avatar_id: string;
  author?: Avatar; // Populated from DB joins so client doesn't hydration-mismatch
  review_count?: number;
  view_count?: number;
  average_score?: number;
  criteria_scores?: Record<string, number>;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at?: string;
  edited_at?: string;
  uses_ai?: boolean;
  ai_tool?: string | null;
  ai_prompt?: string | null;
}

export interface PostMetrics {
  post_id: string;
  average_score: number;
  review_count: number;
  view_count?: number;
  rating_unlocked: boolean;
  /**
   * Per-criterion average scores.
   * Phase 1: undefined (computed locally).
   * Milestone 4: populated by a Supabase SQL view or RPC.
   */
  criteria_scores?: Record<string, number>;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export type BadgeType = 'top_rated_active';

export interface Badge {
  post_id: string;
  badge_type: BadgeType;
  awarded_at: string;
}

// ─── Pulse (Focused Feedback Sessions) ────────────────────────────────────────

export type PulseType = 'choice' | 'slider';

export type PulseDuration = '30m' | '1h' | '6h' | '24h' | '3d' | '7d';

export const PULSE_DURATION_LABELS: Record<PulseDuration, string> = {
  '30m': '30 mins',
  '1h': '1 hour',
  '6h': '6 hours',
  '24h': '24 hours',
  '3d': '3 days',
  '7d': '7 days',
};

export const PULSE_DURATION_MS: Record<PulseDuration, number> = {
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

export interface PulseVote {
  choice: string | number | string[]; // option label for Choice, numeric value for Slider, array for multi-select
  voter_id?: string;            // avatar ID if logged in
  device_id: string;            // device fingerprint for guest de-duplication
  voted_at: string;             // ISO timestamp
}

export interface PulseSession {
  id: string;
  post_id: string;
  creator_id: string;           // avatar ID of the post creator who launched the session
  question: string;
  pulse_type: PulseType;
  duration: PulseDuration;
  options?: string[];           // answer options for choice
  allow_multiple_selections?: boolean; // whether choice allows multiple selections
  slider_min?: number;          // min value for slider type
  slider_max?: number;          // max value for slider type
  slider_step?: number;         // step increment for slider type
  created_at: string;           // ISO timestamp
  expires_at: string;           // ISO timestamp
  votes: PulseVote[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  avatar_id: string;
  actor_id?: string;
  type: 'new_review' | 'badge_awarded' | 'pulse_vote' | 'system' | string;
  post_id?: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

// ─── Insight Output ───────────────────────────────────────────────────────────

export interface InsightOutput {
  summary: string | null;
  strengths: string[];
  areasToImprove: string[];
  meetsThreshold: boolean;
}

// ─── Feedback ───────────────────────────────────────────────────────────────

import type { Database } from './supabase';

export type FeedbackRequest = Database['public']['Views']['feedback_requests_with_stats']['Row'];
export type FeedbackComment = Database['public']['Tables']['feedback_comments']['Row'];
export type FeedbackVote = Database['public']['Tables']['feedback_votes']['Row'];

// ─── Moderation & Reports ───────────────────────────────────────────────────

export type ReportTargetType = 'post' | 'profile';
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string | null;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  action_taken: string | null;
  admin_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Avatar | null;
  target_post?: Post | null;
  target_profile?: Avatar | null;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any> | null;
  created_at: string;
  admin?: Avatar | null;
}

export interface PlatformSetting {
  key: string;
  value: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}

export interface AdminDashboardStats {
  totalProfiles: number;
  totalPosts: number;
  totalReviews: number;
  totalViews: number;
  pendingReports: number;
  activeFeedback: number;
  profilesLast7Days: number;
  postsLast7Days: number;
  reviewsLast7Days: number;
  recentActivity: Array<{
    id: string;
    type: 'post' | 'report' | 'feedback' | 'user';
    title: string;
    subtitle: string;
    timestamp: string;
    link: string;
    status?: string;
  }>;
}

