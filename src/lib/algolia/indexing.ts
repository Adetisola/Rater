/**
 * Algolia Indexing Service
 *
 * Handles writing post data to the Algolia search index.
 * Called as part of the post write flow (create, update, delete).
 *
 * Synchronization contract:
 *   createPost()  → indexPost()
 *   updatePost()  → updatePostIndex()
 *   deletePost()  → deletePostIndex()
 *   (admin tool)  → syncPosts()
 *
 * Phase 1: stubs only — Algolia not yet integrated.
 * Milestone 6: replace stubs with real postsIndex calls.
 */

import type { Post } from '@/types';

/**
 * Index a new post in Algolia.
 */
export async function indexPost(post: Post): Promise<void> {
  // TODO(milestone-6): postsIndex.saveObject({ objectID: post.id, ...post })
  console.warn('[Algolia] indexPost stub — would index:', post.id);
}

/**
 * Partially update an existing post record in Algolia.
 */
export async function updatePostIndex(postId: string, updates: Partial<Post>): Promise<void> {
  // TODO(milestone-6): postsIndex.partialUpdateObject({ objectID: postId, ...updates })
  void updates;
  console.warn('[Algolia] updatePostIndex stub — would update:', postId);
}

/**
 * Remove a post from the Algolia index (called on soft or hard delete).
 */
export async function deletePostIndex(postId: string): Promise<void> {
  // TODO(milestone-6): postsIndex.deleteObject(postId)
  console.warn('[Algolia] deletePostIndex stub — would delete:', postId);
}

/**
 * Full re-sync of all posts to Algolia. Admin/cron use only.
 */
export async function syncPosts(posts: Post[]): Promise<void> {
  // TODO(milestone-6): postsIndex.replaceAllObjects(posts.map(p => ({ objectID: p.id, ...p })))
  console.warn('[Algolia] syncPosts stub — would sync', posts.length, 'posts');
}
