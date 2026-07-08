/**
 * Algolia Search Service
 *
 * This is the ONLY file the rest of the application imports search from.
 * Callers never know whether Fuse.js or Algolia is the active engine.
 *
 * Phase 1: internally uses Fuse.js (local search) for mock-data continuity.
 * Milestone 6: swap internals to Algolia — no consumer changes required.
 */

import type { Post, Avatar, Category } from '@/types';
import {
  createSearchIndexes,
  searchAll as fuseSearchAll,
  searchPosts as fuseSearchPosts,
  type SearchIndexes,
  type SectionedSearchResults,
  type PostSearchResult,
  type AvatarSearchResult,
} from '@/logic/searchUtils';

// Re-export types so consumers don't import from searchUtils directly.
export type { SearchIndexes, SectionedSearchResults, PostSearchResult, AvatarSearchResult };

/**
 * Build the search indexes from the current posts and avatars.
 * Phase 1: creates Fuse.js indexes.
 * Milestone 6: returns Algolia index references instead.
 */
export function buildSearchIndexes(
  posts: Post[],
  avatars: Record<string, Avatar>,
  categories: Category[]
): SearchIndexes {
  // TODO(milestone-6): return Algolia index references, no local indexing needed
  return createSearchIndexes(posts, avatars, categories);
}

/**
 * Search across all content types (posts, avatars, categories).
 */
export async function searchAll(
  indexes: SearchIndexes,
  query: string,
  limits?: { avatars: number; posts: number; categories: number }
): Promise<SectionedSearchResults> {
  // TODO(milestone-6): algoliaClient.multipleQueries([posts, profiles, categories])
  return fuseSearchAll(indexes, query, limits);
}

/**
 * Search posts only.
 */
export async function searchPosts(
  indexes: SearchIndexes,
  query: string,
  limit?: number
): Promise<PostSearchResult[]> {
  // TODO(milestone-6): postsIndex.search(query, { hitsPerPage: limit })
  return fuseSearchPosts(indexes, query, limit);
}

/**
 * Autocomplete / query suggestions.
 * Phase 1: returns empty — autocomplete requires Algolia.
 */
export async function autocomplete(query: string): Promise<string[]> {
  // TODO(milestone-6): algoliaClient.initIndex('posts_query_suggestions').search(query)
  void query;
  return [];
}
