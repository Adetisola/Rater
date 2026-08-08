/**
 * Posts Domain Service
 *
 * All post read/write operations go through this file.
 * Infrastructure (Supabase, Cloudinary) is orchestrated here.
 */

import type { Post } from '@/types';
import { supabase } from './supabase/client';
import { populateProfileCache } from './profiles';

// ─── Reads ────────────────────────────────────────────────────────────────────

export interface FeedFilters {
  limit?: number;
  offset?: number;
  cursor?: string; // Kept for backwards compatibility if needed
  categories?: string[];
  sortBy?: 'balanced' | 'highest_rated' | 'most_reviewed' | 'newest';
  avatarId?: string;
  isRetry?: boolean;
}

/**
 * Fetch the base feed posts (with optional SQL filters).
 */
export async function getFeedPosts(filters: FeedFilters = {}): Promise<Post[]> {
  const { limit = 20, offset = 0, cursor, categories, sortBy = 'balanced', avatarId, isRetry = false } = filters;
  
  let query = supabase
    .from('posts')
    .select('*, profiles(id, username, name, avatar_url)')
    .eq('is_deleted', false);

  if (avatarId) {
    query = query.eq('avatar_id', avatarId);
  }

  if (categories && categories.length > 0) {
    query = query.in('category', categories);
  }

  // Sorting
  if (sortBy === 'highest_rated') {
    // Requires posts to have at least 3 reviews per our previous logic
    query = query.gte('review_count', 3).order('average_score', { ascending: false }).order('created_at', { ascending: false });
  } else if (sortBy === 'most_reviewed') {
    query = query.order('review_count', { ascending: false }).order('created_at', { ascending: false });
  } else {
    // newest and balanced fallback to created_at
    query = query.order('created_at', { ascending: false });
  }

  // Pagination
  if (offset > 0) {
    query = query.range(offset, offset + limit - 1);
  } else if (cursor && (sortBy === 'newest' || sortBy === 'balanced')) {
    query = query.lt('created_at', cursor).limit(limit);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    if (error.message?.toLowerCase().includes('jwt') && error.message?.toLowerCase().includes('expired')) {
      if (!isRetry) {
        console.warn('JWT expired during getFeedPosts, retrying in 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getFeedPosts({ ...filters, isRetry: true });
      } else {
        console.warn('JWT expired during getFeedPosts retry, forcing sign out...');
        if (typeof window !== 'undefined') {
          await supabase.auth.signOut();
          window.location.reload();
        }
      }
    }
    console.error('Error fetching feed posts:', error.message, error.details, error.hint, error);
    return [];
  }
  
  const profilesToCache = data.map((row: any) => row.profiles).filter(Boolean);
  if (profilesToCache.length > 0) populateProfileCache(profilesToCache);
  
  return data.map((row: any) => {
    const { profiles, ...post } = row;
    return { ...post, author: profiles } as Post;
  });
}

/**
 * Fetch a single post by ID.
 */
export async function getPost(postId: string, isRetry = false): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(id, username, name, avatar_url)')
    .eq('id', postId)
    .single();

  if (error) {
    if (error.message?.toLowerCase().includes('jwt') && error.message?.toLowerCase().includes('expired')) {
      if (!isRetry) {
        console.warn(`JWT expired during getPost(${postId}), retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getPost(postId, true);
      } else {
        console.warn(`JWT expired during getPost(${postId}) retry, forcing sign out...`);
        if (typeof window !== 'undefined') {
          await supabase.auth.signOut();
          window.location.reload();
        }
      }
    }
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
  
  if (data.profiles) populateProfileCache([data.profiles]);
  
  const { profiles, ...post } = data as any;
  return { ...post, author: profiles } as Post;
}

/**
 * Fetch all posts belonging to an avatar (for profile pages).
 */
export async function getProfilePosts(avatarId: string, { limit = 20, cursor }: { limit?: number; cursor?: string } = {}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, profiles(id, username, name, avatar_url)')
    .eq('avatar_id', avatarId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching profile posts for ${avatarId}:`, error);
    return [];
  }
  
  const profilesToCache = data.map((row: any) => row.profiles).filter(Boolean);
  if (profilesToCache.length > 0) populateProfileCache(profilesToCache);
  
  return data.map((row: any) => {
    const { profiles, ...post } = row;
    return { ...post, author: profiles } as Post;
  });
}



/**
 * Create a new post.
 */
export async function createPost(post: Omit<Post, 'id' | 'created_at'>): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw new Error(error.message);
  }

  return data as Post;
}

/**
 * Update a post. actorId is verified against post ownership.
 */
export async function updatePost(
  postId: string,
  updates: Partial<Post>,
  actorId: string
): Promise<{ ok: true; post: Post } | { ok: false; error: string }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .eq('avatar_id', actorId)
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, post: data as Post };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Soft delete a post (sets is_deleted = true).
 */
export async function softDeletePost(
  postId: string,
  actorId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const deleted_at = new Date().toISOString();
    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: true, deleted_at })
      .eq('id', postId)
      .eq('avatar_id', actorId);

    if (error) return { ok: false, error: error.message };
    
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Hard delete a post (permanently removes row).
 */
export async function hardDeletePost(
  postId: string,
  actorId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('avatar_id', actorId);

    if (error) return { ok: false, error: error.message };
    
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
