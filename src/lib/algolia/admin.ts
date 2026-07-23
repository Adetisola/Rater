/**
 * Algolia Admin Client — Server-Side Only
 *
 * Initializes the Algolia client using the application's Admin key.
 * Used for writing data to the search index (webhooks, syncing).
 * MUST NOT be imported in frontend components.
 */

import { algoliasearch } from 'algoliasearch';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const adminKey = process.env.ALGOLIA_ADMIN_KEY || '';

export const algoliaAdminClient = (appId && adminKey) ? algoliasearch(appId, adminKey) : null;
