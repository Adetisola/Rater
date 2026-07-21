/**
 * Algolia Search Service
 *
 * This is the ONLY file the rest of the application imports search from.
 * Callers never know whether Fuse.js or Algolia is the active engine.
 *
 * It uses Algolia as the primary engine for posts and profiles,
 * with seamless fallback to Fuse.js local search if Algolia is unavailable.
 */

import type { Post, Avatar, Category } from '@/types';
import { algoliaClient } from './client';
import {
  createSearchIndexes,
  searchAll as fuseSearchAll,
  searchPosts as fuseSearchPosts,
  type SearchIndexes,
  type SectionedSearchResults,
  type PostSearchResult,
  type AvatarSearchResult,
} from '@/logic/searchUtils';

export type { SearchIndexes, SectionedSearchResults, PostSearchResult, AvatarSearchResult };

export function buildSearchIndexes(
  posts: Post[],
  avatars: Record<string, Avatar>,
  categories: Category[]
): SearchIndexes {
  // We still build Fuse.js indexes for the seamless fallback
  // and for searching the static categories list.
  return createSearchIndexes(posts, avatars, categories);
}

export async function searchAll(
  indexes: SearchIndexes,
  query: string,
  limits?: { avatars: number; posts: number; categories: number }
): Promise<SectionedSearchResults> {
  const defaultLimits = { avatars: 3, posts: 5, categories: 3, ...limits };

  if (algoliaClient && query.trim().length > 0) {
    try {
      const profilesPromise = algoliaClient.search({
        requests: [
          {
            indexName: 'profiles',
            query,
            hitsPerPage: defaultLimits.avatars,
          }
        ]
      });

      const postsPromise = algoliaClient.search({
        requests: [
          {
            indexName: 'posts',
            query,
            hitsPerPage: defaultLimits.posts,
          }
        ]
      });

      const [profilesSettled, postsSettled] = await Promise.allSettled([
        profilesPromise,
        postsPromise
      ]);

      let profilesResult: any = null;
      let postsResult: any = null;

      if (profilesSettled.status === 'fulfilled') {
        profilesResult = profilesSettled.value.results[0];
      } else {
        console.warn('[Algolia] Profiles search failed (likely missing index)', profilesSettled.reason);
      }

      if (postsSettled.status === 'fulfilled') {
        postsResult = postsSettled.value.results[0];
      } else {
        throw postsSettled.reason; // If posts fail, we fallback to local fuse entirely
      }

      // For categories, since they are static and small, we can just use the local fuse index.
      const fuseResults = await fuseSearchAll(indexes, query, defaultLimits);

      const mappedAvatars = (profilesResult?.hits || [])
        .map((hit: any) => {
          // Enrich with local data if Algolia record is stale
          const rawAvatar = indexes.rawAvatars?.[hit.objectID];
          const username = hit.username || rawAvatar?.username;
          return {
            avatar: { ...hit, id: hit.objectID, username } as Avatar,
            score: 1 // Algolia handles internal scoring
          };
        })
        .filter((mapped: any) => {
          if (!mapped.avatar.username) {
            console.warn('[Algolia] Filtered malformed profile missing username even after enrichment:', mapped.avatar);
            return false;
          }
          return true;
        });

      // Merge local Fuse avatars with Algolia avatars, deduplicating by ID.
      // This guarantees that any valid creator matching locally won't be lost.
      const avatarMap = new Map<string, any>();
      for (const fuseHit of fuseResults.avatars) {
        avatarMap.set(fuseHit.avatar.id, fuseHit);
      }
      for (const algoliaHit of mappedAvatars) {
        avatarMap.set(algoliaHit.avatar.id, algoliaHit);
      }
      
      const finalAvatars = Array.from(avatarMap.values()).slice(0, defaultLimits.avatars);

      return {
        avatars: finalAvatars,
        posts: (postsResult?.hits || []).map((hit: any) => ({
          post: { ...hit, id: hit.objectID } as Post,
          score: 1,
          matches: undefined
        })),
        categories: fuseResults.categories // Categories remain local
      };
    } catch (e) {
      console.warn('[Algolia] Search failed, falling back to local Fuse.js', e);
    }
  }

  // Fallback to local search
  return await fuseSearchAll(indexes, query, limits);
}

export async function searchPosts(
  indexes: SearchIndexes,
  query: string,
  limit?: number
): Promise<PostSearchResult[]> {
  if (algoliaClient && query.trim().length > 0) {
    try {
      const { results } = await algoliaClient.search({
        requests: [
          {
            indexName: 'posts',
            query,
            hitsPerPage: limit || 10,
          }
        ]
      });
      const postsResult = results[0] as any;
      
      return (postsResult?.hits || []).map((hit: any) => ({
        post: hit as Post,
        score: 1,
        matches: undefined
      }));
    } catch (e) {
      console.warn('[Algolia] Post search failed, falling back to local Fuse.js', e);
    }
  }

  return fuseSearchPosts(indexes, query, limit);
}

export async function autocomplete(query: string): Promise<string[]> {
  if (algoliaClient && query.trim().length > 0) {
    try {
      // Instead of relying on a Query Suggestions index (which needs search history),
      // we query the actual posts index directly to auto-suggest real post titles!
      const { results } = await algoliaClient.search({
        requests: [
          {
            indexName: 'posts',
            query,
            hitsPerPage: 5,
          }
        ]
      });
      const postsResult = results[0] as any;
      return (postsResult?.hits || []).map((hit: any) => hit.title);
    } catch (e) {
      console.warn('[Algolia] Autocomplete failed', e);
    }
  }
  return [];
}
