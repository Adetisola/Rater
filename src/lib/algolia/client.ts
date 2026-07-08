/**
 * Algolia Client — Infrastructure Layer
 *
 * TODO(milestone-6): Configure the Algolia search client.
 *
 * import algoliasearch from 'algoliasearch';
 * export const algoliaClient = algoliasearch(
 *   process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
 *   process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY! // read-only key for client
 * );
 * export const postsIndex = algoliaClient.initIndex('posts');
 * export const profilesIndex = algoliaClient.initIndex('profiles');
 *
 * Nothing outside lib/algolia/ should import this directly.
 * lib/algolia/search.ts and lib/algolia/indexing.ts are the public API.
 */

// Placeholders — not used in Phase 1.
export const algoliaClient = null;
export const postsIndex = null;
export const profilesIndex = null;
