/**
 * Algolia Indexing Service (Client-Side)
 *
 * Notice: With the Milestone 6 architecture update, all Algolia indexing
 * is now handled exclusively by Supabase Database Webhooks invoking 
 * an Edge Function (`sync-algolia`). 
 *
 * The client no longer pushes directly to Algolia, preventing race conditions 
 * and protecting the Write Key. These stubs remain as no-ops to avoid breaking 
 * existing component imports.
 */

import type { Post } from '@/types';

export async function indexPost(_post: Post): Promise<void> {
  // Handled by DB Webhook
}

export async function updatePostIndex(_postId: string, _updates: Partial<Post>): Promise<void> {
  // Handled by DB Webhook
}

export async function deletePostIndex(_postId: string): Promise<void> {
  // Handled by DB Webhook
}

export async function syncPosts(_posts: Post[]): Promise<void> {
  // Admin script only, not typically run from the client
}
