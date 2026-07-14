/**
 * Reserved route segments that cannot be used as usernames.
 * These match top-level app routes to prevent conflicts.
 */
export const RESERVED_ROUTES = new Set([
  'admin',
  'api',
  'app',
  'avatar',
  'about',
  'browse',
  'discover',
  'explore',
  'feed',
  'feedback',
  'help',
  'home',
  'legal',
  'login',
  'notifications',
  'official',
  'official_rater',
  'post',
  'privacy',
  'profile',
  'rater',
  'rater_official',
  'search',
  'settings',
  'signup',
  'submit',
  'support',
  'terms',
  'timi',
  'timi_adetisola',
]);

/**
 * Reserved prefixes that cannot be used at the start of a username.
 * Used for system-generated placeholders or internal accounts.
 */
export const RESERVED_PREFIXES = [
  'user_',
  'temp_',
  'oauth_',
  'system_',
];
