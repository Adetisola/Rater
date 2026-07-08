// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL MOCK STORE
//
// Do NOT import this file from components, hooks, contexts, or pages.
// All external access goes through:
//   lib/posts.ts       — getFeedPosts, getPost, updatePost, deletePost
//   lib/reviews.ts     — getReviewsByPostId, getReviewerName
//   lib/metrics.ts     — getPostMetrics, getTrendingScore, getCuratedScore
//   lib/profiles.ts    — getAllProfiles, getProfile, findAvatarByCredentials
//   lib/badges.ts      — getActiveBadges
//   constants/categories.ts — CATEGORIES
//
// This file will be deleted in Milestone 7 (Supabase integration complete).
// ─────────────────────────────────────────────────────────────────────────────

import type { Category, Avatar, Post } from '../types';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- MOCK DATABASE ---

export const CATEGORIES: Category[] = [
  'Web Design',
  'Mobile App Design',
  'Brand Identity Design',
  'Mockup Design',
  'Logo Design',
  'Poster Design',
  'Flyer Design',
  'Social Media Design',
  'AI Image',
  '3D Design',
  'Packaging Design',
  'Banner Design',
  'Ad Creative Design',
  'Illustration',
  'Icon Design',
  'Typography Design',
  'UI Design',
  'Landing Page Design',
  'Dashboard Design'
];

/**
 * PRODUCTION NOTE: In a real Supabase/PostgreSQL environment:
 * - Passkeys MUST be hashed using bcrypt or similar.
 * - This Avatar table would likely be an 'avatars' table linked to 'auth.users'.
 */
export const MOCK_AVATARS: Record<string, Avatar> = {
  'user_1': {
    id: 'user_1',
    username: 'timi',
    email: 'timi@rater.com',
    name: 'Timi',
    role: 'Product Designer',
    avatar_url: 'https://i.ibb.co/4nPVJ9kP/8f726ed71fc83469a1c54aa4cf114282.jpg',
    bg_color: '#FEC312',
    bio: 'Product designer obsessed with minimalist interfaces and intuitive user flows.',
    is_blocked: false,
    passkey: '1234',
    created_at: '2026-01-01T00:00:00Z',
    social_links: [
      {
        type: 'instagram',
        url: 'https://www.instagram.com/timi.adetisola',
        username: 'timi.adetisola'
      }
    ]
  },
  'user_2': {
    id: 'user_2',
    username: 'sarah_chen',
    email: 'sarah@rater.com',
    name: 'Sarah Chen',
    role: 'UI/UX Designer',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    bg_color: '#7C3BED',
    bio: 'Mobile-first designer specializing in visual systems and interaction design.',
    is_blocked: false,
    passkey: '1111',
    created_at: '2026-01-05T00:00:00Z'
  },
  'user_3': {
    id: 'user_3',
    username: 'marcus_j',
    email: 'marcus@rater.com',
    name: 'Marcus Johnson',
    role: 'Creative Director',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    bg_color: '#3B82F6',
    bio: 'Multidisciplinary creative director focused on branding and digital experiences.',
    is_blocked: false,
    passkey: '2222',
    created_at: '2026-01-10T00:00:00Z'
  },
  'user_4': {
    id: 'user_4',
    username: 'elena_r',
    email: 'elena@rater.com',
    name: 'Elena Rodriguez',
    role: 'Visual Designer',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    bg_color: '#10B981',
    bio: 'Exploring the intersection of artificial intelligence and human-centered design.',
    is_blocked: false,
    passkey: '3333',
    created_at: '2026-01-15T00:00:00Z'
  },
  'user_5': {
    id: 'user_5',
    username: 'james_park',
    email: 'james@rater.com',
    name: 'James Park',
    role: 'Branding Specialist',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    bg_color: '#F59E0B',
    bio: 'Branding specialist with a passion for typography and bold visual identities.',
    is_blocked: false,
    passkey: '4444',
    created_at: '2026-01-20T00:00:00Z'
  },
  'user_blocked': {
    id: 'user_blocked',
    username: 'spammer',
    email: 'spammer@rater.com',
    name: 'Spammer',
    role: 'Designer',
    bg_color: '#999999',
    bio: 'Blocked for violating community standards.',
    is_blocked: true,
    passkey: '0000',
    created_at: '2024-01-25T00:00:00Z'
  }
};



export async function updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
  await delay(800);
  console.log(`[DB] Updating post ${postId}`, updates);
  // In a real app, this would be a PATCH request
  return { id: postId, ...updates } as Post;
}

export async function deletePost(postId: string): Promise<boolean> {
  await delay(1000);
  console.log(`[DB] Deleting post ${postId} (Soft Delete Simulation)`);
  return true;
}

export async function hardDeletePost(postId: string): Promise<boolean> {
  await delay(1500);
  console.log(`[DB] HARD Deleting post ${postId} and cascading relations`);
  return true;
}
