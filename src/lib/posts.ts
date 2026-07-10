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

/**
 * Fetch the base feed posts (without localStorage session overlays).
 */
export async function getFeedPosts({ limit = 20, cursor }: { limit?: number; cursor?: string } = {}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, profiles(id, username, name, avatar_url, bg_color)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching feed posts:', error);
    return [];
  }
  
  const profilesToCache = data.map((row: any) => row.profiles).filter(Boolean);
  if (profilesToCache.length > 0) populateProfileCache(profilesToCache);
  
  return data.map((row: any) => {
    const { profiles, ...post } = row;
    return post as Post;
  });
}

/**
 * Fetch a single post by ID.
 */
export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(id, username, name, avatar_url, bg_color)')
    .eq('id', postId)
    .single();

  if (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
  
  if (data.profiles) populateProfileCache([data.profiles]);
  
  const { profiles, ...post } = data as any;
  return post as Post;
}

/**
 * Fetch all posts belonging to an avatar (for profile pages).
 */
export async function getProfilePosts(avatarId: string, { limit = 20, cursor }: { limit?: number; cursor?: string } = {}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, profiles(id, username, name, avatar_url, bg_color)')
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
    return post as Post;
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
