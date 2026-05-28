/**
 * Centralized type definitions for the Rater platform.
 *
 * All domain types live here so they can be imported from '@/types'
 * by any layer (components, hooks, logic, utils) without creating
 * circular dependencies.
 */

import type { SocialLink } from '../utils/socialLinksUtils';

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
  bg_color: string;
  bio?: string;
  is_blocked: boolean;
  passkey: string;
  created_at: string;
  // Username history — for old-URL redirects and Supabase migration
  username_last_changed_at?: string | null;    // ISO timestamp of last username change
  previous_usernames?: string[];      // Ordered list of past usernames (oldest first)
  social_links?: SocialLink[];
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  post_id: string;
  reviewer_id?: string;
  reviewer_name?: string;
  device_id?: string;
  clarity?: number;
  purpose?: number;
  aesthetics?: number;
  // Contextual Fields
  usability?: number;
  recognition?: number;
  impact?: number;
  engagement?: number;
  composition?: number;
  detail?: number;
  
  comment?: string;
  created_at: string;
  updated_at?: string;
}

// ─── Posts ─────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  title: string;
  description: string;
  category: Category;
  image_url: string;
  avatar_id: string;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface PostMetrics {
  post_id: string;
  average_score: number;
  review_count: number;
  rating_unlocked: boolean;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export type BadgeType = 'top_rated_active' | 'top_rated_previous';

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
