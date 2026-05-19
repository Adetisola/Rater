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
  role: string;                      // public-facing identity label
  avatar_url?: string;
  bg_color: string;
  bio?: string;
  is_blocked: boolean;
  passkey: string;
  created_at: string;
  // Username history — for old-URL redirects and Supabase migration
  usernameLastChangedAt?: number;    // Unix ms timestamp of last username change
  previousUsernames?: string[];      // Ordered list of past usernames (oldest first)
  social_links?: SocialLink[];
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  post_id: string;
  reviewer_id?: string;
  reviewer_name?: string;
  device_id?: string;
  clarity: number;
  purpose: number;
  aesthetics: number;
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
