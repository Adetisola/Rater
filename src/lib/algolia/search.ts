/**
 * Algolia Search & Discovery Service
 *
 * Algolia is the single authoritative relevance engine for search.
 * Local ProfileCache is used strictly for synchronous avatar enrichment and emergency fallback.
 */

import type { Post, Avatar, Category } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { AI_TOOLS } from '@/types';
import { ProfileCache } from '@/lib/profiles';
import { algoliaClient } from './client';
import {
  createSearchIndexes,
  searchAll as fuseSearchAll,
  searchPosts as fuseSearchPosts,
  type SearchIndexes,
  type SectionedSearchResults,
  type PostSearchResult,
  type AvatarSearchResult,
  type CategorySearchResult,
} from '@/logic/searchUtils';

export type { SearchIndexes, SectionedSearchResults, PostSearchResult, AvatarSearchResult, CategorySearchResult };

/**
 * Builds fallback Fuse.js search indexes using posts and all cached avatars.
 */
export function buildSearchIndexes(
  posts: Post[],
  avatars: Record<string, Avatar> = {},
  categories: Category[] = CATEGORIES as Category[]
): SearchIndexes {
  // Merge any explicitly provided avatars with the full client-side ProfileCache
  const allAvatarsMap: Record<string, Avatar> = { ...avatars };
  const cachedProfiles = ProfileCache.getAll();
  cachedProfiles.forEach(p => {
    if (p.id) allAvatarsMap[p.id] = p;
  });

  return createSearchIndexes(posts, allAvatarsMap, categories);
}

/**
 * Generates dynamic, context-aware query autocompletions (strings) for the search bar.
 * Combines 4 signals:
 * 1. Personal Recent Searches (highest personal relevance)
 * 2. Live Content Matches (creator names & post titles from Algolia / local cache)
 * 3. Official Platform Taxonomy (categories & AI tools)
 * 4. Platform Popular Queries (optional injected list from Redis / Analytics)
 */
export function getQuerySuggestions(
  query: string,
  recentSearches: string[] = [],
  popularSearches: string[] = [],
  liveEntities: { creatorNames?: string[]; postTitles?: string[] } = {},
  limit = 5
): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized || normalized.length < 1) return [];

  const suggestions: Array<{ text: string; score: number }> = [];
  const seen = new Set<string>();

  const addCandidate = (text: string, baseScore: number) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower === normalized || seen.has(lower)) return;

    // Check match relationship
    if (lower.startsWith(normalized)) {
      // Prefix match gets highest priority
      suggestions.push({ text: trimmed, score: baseScore + 10 });
      seen.add(lower);
    } else if (lower.includes(normalized)) {
      // Partial containment
      suggestions.push({ text: trimmed, score: baseScore });
      seen.add(lower);
    }
  };

  // Signal 1: Personal Recent Searches (baseScore: 100)
  recentSearches.forEach(recent => addCandidate(recent, 100));

  // Signal 2: Live Content Matches (baseScore: 80 for creators, 70 for post titles)
  (liveEntities.creatorNames || []).forEach(name => addCandidate(name, 80));
  (liveEntities.postTitles || []).forEach(title => addCandidate(title, 70));

  // Signal 3: Official Platform Categories (baseScore: 60)
  CATEGORIES.forEach(cat => addCandidate(cat, 60));
  AI_TOOLS.forEach(tool => addCandidate(tool.label, 50));

  // Signal 4: Platform-wide Popular Queries (baseScore: 40)
  popularSearches.forEach(pop => addCandidate(pop, 40));

  // Sort by score descending and return top `limit` strings
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.text);
}

/**
 * Main search function across Creatives, Works, and Categories.
 * Uses Algolia as authoritative engine with graceful local fallback.
 */
export async function searchAll(
  indexes: SearchIndexes,
  query: string,
  limits?: { avatars?: number; posts?: number; categories?: number }
): Promise<SectionedSearchResults> {
  const defaultLimits = { avatars: 4, posts: 6, categories: 3, ...limits };
  const trimmed = query.trim();

  if (!trimmed) {
    return { avatars: [], posts: [], categories: [] };
  }

  // 1. Primary Engine: Algolia Search
  if (algoliaClient && trimmed.length > 0) {
    try {
      const [profilesSettled, postsSettled] = await Promise.allSettled([
        algoliaClient.search({
          requests: [
            {
              indexName: 'profiles',
              query: trimmed,
              hitsPerPage: defaultLimits.avatars,
            }
          ]
        }),
        algoliaClient.search({
          requests: [
            {
              indexName: 'posts',
              query: trimmed,
              hitsPerPage: defaultLimits.posts,
            }
          ]
        })
      ]);

      let profilesResult: any = null;
      let postsResult: any = null;

      if (profilesSettled.status === 'fulfilled') {
        profilesResult = profilesSettled.value.results[0];
      } else {
        console.warn('[Algolia] Profiles search query failed', profilesSettled.reason);
      }

      if (postsSettled.status === 'fulfilled') {
        postsResult = postsSettled.value.results[0];
      } else {
        console.warn('[Algolia] Posts search query failed', postsSettled.reason);
      }

      // If at least one Algolia query succeeded, format results with cache enrichment
      if (profilesResult || postsResult) {
        // Creatives mapping & enrichment
        const mappedAvatars: AvatarSearchResult[] = (profilesResult?.hits || [])
          .map((hit: any) => {
            const cached = ProfileCache.get(hit.objectID) || indexes.rawAvatars?.[hit.objectID];
            const username = hit.username || cached?.username || '';
            const name = hit.name || cached?.name || username;
            const role = hit.role || cached?.role || null;
            const avatarUrl = hit.avatar_url || cached?.avatar_url || '';
            const bio = hit.bio || cached?.bio || '';

            const avatar: Avatar = {
              id: hit.objectID,
              username,
              name,
              role,
              email: hit.email || cached?.email || '',
              avatar_url: avatarUrl,
              bio,
              bg_color: hit.bg_color || cached?.bg_color || '#1A1A1A',
              created_at: hit.created_at || cached?.created_at || new Date().toISOString(),
              is_blocked: false,
            };

            return {
              avatar,
              score: 1
            };
          })
          .filter((item: AvatarSearchResult) => Boolean(item.avatar.username));

        // Works mapping
        const mappedPosts: PostSearchResult[] = (postsResult?.hits || []).map((hit: any) => ({
          post: {
            id: hit.objectID,
            title: hit.title,
            description: hit.description,
            category: hit.category,
            avatar_id: hit.avatar_id,
            image_url: hit.image_url,
            created_at: hit.created_at || new Date().toISOString(),
            review_count: hit.review_count || 0,
            average_score: hit.average_score || 0,
          } as Post,
          score: 1,
          matches: undefined,
        }));

        // Categories matching (local taxonomy matching)
        const matchingCategories = CATEGORIES
          .filter(cat => cat.toLowerCase().includes(trimmed.toLowerCase()))
          .slice(0, defaultLimits.categories)
          .map(category => ({ category: category as Category, score: 1 }));

        const finalResults = {
          avatars: mappedAvatars,
          posts: mappedPosts,
          categories: matchingCategories,
        };

        return finalResults;
      }
    } catch (e) {
      console.warn('[Algolia] Search exception, falling back to local index', e);
    }
  }

  // 2. Emergency Fallback: Local Fuse Index
  const fallbackResults = await fuseSearchAll(indexes, trimmed, defaultLimits);
  return fallbackResults;
}

/**
 * Search posts specifically for the Browse Grid view.
 */
export async function searchPosts(
  indexes: SearchIndexes,
  query: string,
  limit = 100
): Promise<PostSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (algoliaClient) {
    try {
      const { results } = await algoliaClient.search({
        requests: [
          {
            indexName: 'posts',
            query: trimmed,
            hitsPerPage: limit,
          }
        ]
      });
      const postsResult = results[0] as any;
      return (postsResult?.hits || []).map((hit: any) => ({
        post: {
          ...hit,
          id: hit.objectID,
        } as Post,
        score: 1,
        matches: undefined,
      }));
    } catch (e) {
      console.warn('[Algolia] Post search failed, falling back to local Fuse.js', e);
    }
  }

  return fuseSearchPosts(indexes, trimmed, limit);
}
