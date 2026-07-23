/**
 * Algolia Client — Infrastructure Layer
 *
 * Initializes the Algolia client using the application's read-only search key.
 * Used for querying the search index.
 */

import { liteClient as algoliasearch } from 'algoliasearch/lite';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '';

export const algoliaClient = (appId && searchKey) ? algoliasearch(appId, searchKey) : null;
