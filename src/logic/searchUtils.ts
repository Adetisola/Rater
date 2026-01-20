import Fuse, { type IFuseOptions, type FuseResultMatch } from 'fuse.js';
import type { Post } from './mockData';

// Fuse.js configuration with weighted fields
// Threshold: 0.35 allows for ~2-3 character errors in longer words
// Lower = stricter matching, Higher = more fuzzy
const FUSE_OPTIONS: IFuseOptions<Post> = {
  keys: [
    { name: 'title', weight: 1.0 },       // Highest priority
    { name: 'category', weight: 0.8 },    // Medium-high priority
    { name: 'description', weight: 0.6 }, // Medium priority
  ],
  threshold: 0.35,           // Fuzzy tolerance (0 = exact, 1 = match anything)
  includeMatches: true,      // Return match indices for highlighting
  includeScore: true,        // Return relevance score
  minMatchCharLength: 2,     // Minimum chars to trigger search
  ignoreLocation: true,      // Match anywhere in string, not just beginning
  useExtendedSearch: false,  // Standard fuzzy search
  findAllMatches: true,      // Continue searching after first match
};

export interface SearchResult {
  item: Post;
  score: number;
  matches: readonly FuseResultMatch[] | undefined;
}

/**
 * Create a Fuse.js search instance.
 * Call this once and reuse to avoid rebuilding index.
 */
export function createSearchIndex(posts: Post[]): Fuse<Post> {
  return new Fuse(posts, FUSE_OPTIONS);
}

/**
 * Search posts using a pre-built Fuse index.
 * @param fuse - Pre-built Fuse instance
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 10)
 */
export function searchPosts(
  fuse: Fuse<Post>,
  query: string,
  limit: number = 10
): SearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const results = fuse.search(query.trim(), { limit });
  
  return results.map(result => ({
    item: result.item,
    score: result.score ?? 1,
    matches: result.matches,
  }));
}

/**
 * Highlight matched text in a string.
 * Returns an array of segments with isMatch flag.
 */
export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

export function highlightMatches(
  text: string,
  matches: readonly FuseResultMatch[] | undefined,
  key: string
): HighlightSegment[] {
  if (!matches || !text) {
    return [{ text, isMatch: false }];
  }

  // Find matches for this specific key
  const keyMatches = matches.filter(m => m.key === key);
  if (keyMatches.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Collect all match indices
  const allIndices: Array<[number, number]> = [];
  keyMatches.forEach(m => {
    if (m.indices) {
      allIndices.push(...(m.indices as Array<[number, number]>));
    }
  });

  if (allIndices.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Sort and merge overlapping indices
  allIndices.sort((a, b) => a[0] - b[0]);
  const mergedIndices: Array<[number, number]> = [];
  
  for (const [start, end] of allIndices) {
    const last = mergedIndices[mergedIndices.length - 1];
    if (last && start <= last[1] + 1) {
      // Overlapping or adjacent, merge
      last[1] = Math.max(last[1], end);
    } else {
      mergedIndices.push([start, end]);
    }
  }

  // Build segments
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const [start, end] of mergedIndices) {
    // Non-matching segment before this match
    if (cursor < start) {
      segments.push({
        text: text.slice(cursor, start),
        isMatch: false,
      });
    }
    // Matching segment
    segments.push({
      text: text.slice(start, end + 1),
      isMatch: true,
    });
    cursor = end + 1;
  }

  // Remaining non-matching text
  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      isMatch: false,
    });
  }

  return segments;
}

/**
 * Filter search results by categories.
 * Use this to post-process Fuse results with existing category filters.
 */
export function filterSearchResultsByCategory(
  results: SearchResult[],
  categories: string[]
): SearchResult[] {
  if (categories.length === 0) {
    return results;
  }
  return results.filter(r => categories.includes(r.item.category));
}
