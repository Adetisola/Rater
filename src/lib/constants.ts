/**
 * Reserved route segments that cannot be used as usernames.
 * These match top-level app routes to prevent conflicts.
 */
export const RESERVED_ROUTES = new Set([
  'browse',
  'submit',
  'settings',
  'post',
  'login',
  'signup',
  'search',
  'notifications',
  'profile',
  'api',
  'avatar',
  'app',
  'admin',
  'about',
  'help',
  'terms',
  'privacy',
  'feed',
  'explore',
  'discover',
  'home',
  'rater',
  'rater_official',
  'timi_adetisola',
  'official_rater',
]);
