import Fuse, { type IFuseOptions, type FuseResultMatch } from 'fuse.js';
import type { Post, Avatar, Category } from './mockData';

// ============================================================================
// TEXT NORMALIZATION
// ============================================================================

const STEMMING_RULES: Array<[RegExp, string]> = [
  [/ies$/i, 'y'],
  [/(ss|x|z|ch|sh)es$/i, '$1'],
  [/([^s])s$/i, '$1'],
  [/ing$/i, ''],
  [/ed$/i, ''],
];

function stemWord(word: string): string {
  let stemmed = word.toLowerCase();
  for (const [pattern, replacement] of STEMMING_RULES) {
    if (pattern.test(stemmed)) {
      stemmed = stemmed.replace(pattern, replacement);
      break;
    }
  }
  return stemmed;
}

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .map(word => stemWord(word.trim()))
    .filter(word => word.length > 0)
    .join(' ')
    .trim();
}

// ============================================================================
// TYPES FOR SEARCH RESULTS
// ============================================================================

export interface DesignerSearchResult {
  avatar: Avatar;
  score: number;
}

export interface PostSearchResult {
  post: Post;
  score: number;
  matches: readonly FuseResultMatch[] | undefined;
}

export interface CategorySearchResult {
  category: Category;
  score: number;
}

export interface SectionedSearchResults {
  designers: DesignerSearchResult[];
  posts: PostSearchResult[];
  categories: CategorySearchResult[];
}

// ============================================================================
// NORMALIZED TYPES FOR FUSE INDEXING
// ============================================================================

interface NormalizedAvatar extends Avatar {
  name_normalized: string;
}

interface NormalizedPost extends Post {
  title_normalized: string;
  category_normalized: string;
  description_normalized: string;
  designer_name: string;
  designer_name_normalized: string;
}

interface NormalizedCategory {
  name: Category;
  name_normalized: string;
}

// ============================================================================
// SEARCH INDEXES
// ============================================================================

export interface SearchIndexes {
  designers: Fuse<NormalizedAvatar>;
  posts: Fuse<NormalizedPost>;
  categories: Fuse<NormalizedCategory>;
}

/**
 * Create all search indexes.
 */
export function createSearchIndexes(
  posts: Post[],
  avatars: Record<string, Avatar>,
  categories: Category[]
): SearchIndexes {
  // Normalize Avatars
  const normalizedAvatars: NormalizedAvatar[] = Object.values(avatars)
    .filter(a => !a.isBlocked)
    .map(avatar => ({
      ...avatar,
      name_normalized: normalizeText(avatar.name),
    }));

  // Normalize Posts with designer name
  const normalizedPosts: NormalizedPost[] = posts.map(post => {
    const designer = avatars[post.designerId];
    const designerName = designer ? designer.name : '';
    return {
      ...post,
      title_normalized: normalizeText(post.title),
      category_normalized: normalizeText(post.category),
      description_normalized: normalizeText(post.description),
      designer_name: designerName,
      designer_name_normalized: normalizeText(designerName),
    };
  });

  // Normalize Categories
  const normalizedCategories: NormalizedCategory[] = categories.map(cat => ({
    name: cat,
    name_normalized: normalizeText(cat),
  }));

  // Avatar Index - search by designer name only
  const avatarOptions: IFuseOptions<NormalizedAvatar> = {
    keys: [{ name: 'name_normalized', weight: 1.0 }],
    threshold: 0.3,
    includeScore: true,
  };

  // Post Index - weighted fields with designer_name as low weight
  const postOptions: IFuseOptions<NormalizedPost> = {
    keys: [
      { name: 'title_normalized', weight: 1.0 },
      { name: 'category_normalized', weight: 0.7 },
      { name: 'description_normalized', weight: 0.5 },
      { name: 'designer_name_normalized', weight: 0.3 },
    ],
    threshold: 0.35,
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
    findAllMatches: true,
  };

  // Category Index - exact category matching
  const categoryOptions: IFuseOptions<NormalizedCategory> = {
    keys: [{ name: 'name_normalized', weight: 1.0 }],
    threshold: 0.3,
    includeScore: true,
  };

  return {
    designers: new Fuse(normalizedAvatars, avatarOptions),
    posts: new Fuse(normalizedPosts, postOptions),
    categories: new Fuse(normalizedCategories, categoryOptions),
  };
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search all indexes and return sectioned results for the dropdown.
 */
export function searchAll(
  indexes: SearchIndexes,
  query: string,
  limits: { designers: number; posts: number; categories: number } = { designers: 3, posts: 5, categories: 3 }
): SectionedSearchResults {
  if (!query || query.trim().length < 2) {
    return { designers: [], posts: [], categories: [] };
  }

  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < 2) {
    return { designers: [], posts: [], categories: [] };
  }

  // Search designers
  const designerResults = indexes.designers
    .search(normalizedQuery, { limit: limits.designers })
    .map(result => ({
      avatar: result.item as Avatar,
      score: result.score ?? 1,
    }));

  // Search posts
  const postResults = indexes.posts
    .search(normalizedQuery, { limit: limits.posts })
    .map(result => ({
      post: result.item as Post,
      score: result.score ?? 1,
      matches: result.matches,
    }));

  // Search categories
  const categoryResults = indexes.categories
    .search(normalizedQuery, { limit: limits.categories })
    .map(result => ({
      category: result.item.name,
      score: result.score ?? 1,
    }));

  return {
    designers: designerResults,
    posts: postResults,
    categories: categoryResults,
  };
}

/**
 * Search posts only (for Enter key behavior and grid filtering).
 * Designer name matches rank higher.
 */
export function searchPosts(
  indexes: SearchIndexes,
  query: string,
  limit: number = 100
): PostSearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const results = indexes.posts
    .search(normalizedQuery, { limit })
    .map(result => ({
      post: result.item as Post,
      score: result.score ?? 1,
      matches: result.matches,
    }));

  return results;
}

// ============================================================================
// HIGHLIGHTING (uses original text)
// ============================================================================

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

  const normalizedKey = key + '_normalized';
  const keyMatches = matches.filter(m => m.key === key || m.key === normalizedKey);
  
  if (keyMatches.length === 0) {
    return [{ text, isMatch: false }];
  }

  const matchedWords = new Set<string>();
  
  keyMatches.forEach(m => {
    if (m.indices && m.value) {
      m.indices.forEach(([start, end]) => {
        const word = m.value!.slice(start, end + 1).toLowerCase();
        matchedWords.add(word);
        matchedWords.add(stemWord(word));
      });
    }
  });

  if (matchedWords.size === 0) {
    return [{ text, isMatch: false }];
  }

  const segments: HighlightSegment[] = [];
  const words = text.split(/(\s+)/);
  
  for (const word of words) {
    if (/^\s+$/.test(word)) {
      if (segments.length > 0 && !segments[segments.length - 1].isMatch) {
        segments[segments.length - 1].text += word;
      } else {
        segments.push({ text: word, isMatch: false });
      }
    } else {
      const wordLower = word.toLowerCase();
      const wordStemmed = stemWord(wordLower);
      const isMatch = matchedWords.has(wordLower) || matchedWords.has(wordStemmed);
      
      if (segments.length > 0 && segments[segments.length - 1].isMatch === isMatch) {
        segments[segments.length - 1].text += word;
      } else {
        segments.push({ text: word, isMatch });
      }
    }
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

// ============================================================================
// CATEGORY FILTERING (for post-processing)
// ============================================================================

export function filterSearchResultsByCategory(
  results: PostSearchResult[],
  categories: string[]
): PostSearchResult[] {
  if (categories.length === 0) {
    return results;
  }
  return results.filter(r => categories.includes(r.post.category));
}
