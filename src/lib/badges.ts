/**
 * Badges Domain Service
 *
 * Computes and retrieves badge assignments for posts.
 * Badge eligibility logic lives in logic/badgeUtils.ts.
 * This file is the public API — consumers import from here, not from badgeUtils.
 *
 * Phase 1: wraps local badge computation.
 * Milestone 7 (cleanup): badges become server-computed; replace with
 * supabase.from('badges').select().in('post_id', postIds)
 */

import type { Post, BadgeType } from '@/types';
import { computeBadges } from '@/logic/badgeUtils';

/**
 * Get the active badge map for a set of posts.
 * Returns a Record<postId, BadgeType> for all posts that have earned a badge.
 *
 * TODO(milestone-7): supabase.from('badges').select().in('post_id', posts.map(p => p.id))
 */
export async function getActiveBadges(
  posts: Post[]
): Promise<Record<string, BadgeType>> {
  return computeBadges(posts);
}
