import { algoliasearch } from 'algoliasearch';
import type { Post, Avatar, Category } from '../types';

// ============================================================================
// ALGOLIA CONFIGURATION
// ============================================================================

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '';

// Initialize client only if keys are present (to prevent crashes before migration)
export const algoliaClient = (ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY) 
  ? algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY) 
  : null;

// ============================================================================
// TYPES FOR SEARCH RESULTS
// ============================================================================

export interface AvatarSearchResult {
  avatar: Avatar;
  score: number;
}

export interface PostSearchResult {
  post: Post;
  score: number;
  // We keep the matches type similar to Fuse for compatibility, 
  // but Algolia uses _highlightResult. We'll adapt it in the highlight component.
  matches: any; 
  algoliaHighlight?: any;
}

export interface CategorySearchResult {
  category: Category;
  score: number;
}

export interface SectionedSearchResults {
  avatars: AvatarSearchResult[];
  posts: PostSearchResult[];
  categories: CategorySearchResult[];
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search all indexes and return sectioned results for the dropdown.
 */
export async function searchAll(
  query: string,
  limits: { avatars: number; posts: number; categories: number } = { avatars: 3, posts: 5, categories: 3 }
): Promise<SectionedSearchResults> {
  if (!algoliaClient) {
    console.warn("Algolia is not configured yet. Fallback to empty results.");
    return { avatars: [], posts: [], categories: [] };
  }

  if (!query || query.trim().length < 2) {
    return { avatars: [], posts: [], categories: [] };
  }

  try {
    // Perform multiple queries in a single network request
    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: 'rater_avatars',
          query,
          hitsPerPage: limits.avatars
        },
        {
          indexName: 'rater_posts',
          query,
          hitsPerPage: limits.posts
        }
      ]
    });

    const avatarHits = (results[0] as any)?.hits || [];
    const postHits = (results[1] as any)?.hits || [];

    const avatars = avatarHits.map((hit: any) => ({
      avatar: hit as Avatar,
      score: 1, // Algolia handles relevance natively
    }));

    const posts = postHits.map((hit: any) => ({
      post: hit as Post,
      score: 1,
      matches: undefined,
      algoliaHighlight: hit._highlightResult,
    }));

    // Categories can be hardcoded or indexed separately
    const categories: CategorySearchResult[] = [];

    return { avatars, posts, categories };
  } catch (error) {
    throw await import('@/lib/errors/normalizeError').then(m => m.normalizeError(error, {
      fallbackCode: 'RATER_NETWORK_002',
      fallbackMessage: 'Search failed. Please try again.',
      context: { action: 'searchAll', query }
    }));
  }
}

/**
 * Search posts only (for Enter key behavior and grid filtering).
 */
export async function searchPosts(
  query: string,
  limit: number = 100
): Promise<PostSearchResult[]> {
  if (!algoliaClient) return [];
  if (!query || query.trim().length < 2) return [];

  try {
    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: 'rater_posts',
          query,
          hitsPerPage: limit
        }
      ]
    });
    const hits = (results[0] as any)?.hits || [];

    return hits.map((hit: any) => ({
      post: hit as Post,
      score: 1,
      matches: undefined,
      algoliaHighlight: hit._highlightResult,
    }));
  } catch (error) {
    throw await import('@/lib/errors/normalizeError').then(m => m.normalizeError(error, {
      fallbackCode: 'RATER_NETWORK_002',
      fallbackMessage: 'Search failed. Please try again.',
      context: { action: 'searchPosts', query }
    }));
  }
}

// ============================================================================
// HIGHLIGHTING ADAPTER
// ============================================================================

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Adapter to convert Algolia's _highlightResult into the HighlightSegment[] 
 * format expected by our UI, keeping the visual styling identical.
 */
export function highlightAlgoliaMatches(
  originalText: string,
  highlightResult: any,
  key: string
): HighlightSegment[] {
  if (!highlightResult || !highlightResult[key]) {
    return [{ text: originalText, isMatch: false }];
  }

  // Algolia returns strings with <em> tags, e.g., "Hello <em>World</em>!"
  const htmlStr = highlightResult[key].value;
  
  // Parse the string into segments
  const segments: HighlightSegment[] = [];
  const parts = htmlStr.split(/(<em>.*?<\/em>)/g);
  
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('<em>') && part.endsWith('</em>')) {
      segments.push({
        text: part.slice(4, -5),
        isMatch: true
      });
    } else {
      segments.push({
        text: part,
        isMatch: false
      });
    }
  }

  return segments;
}
