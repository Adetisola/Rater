/**
 * Social Links Utilities
 * Detects, parses, and manages social platform links in user bios.
 */

export type SocialPlatform =
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'behance'
  | 'dribbble'
  | 'linktree'
  | 'github'
  | 'pinterest'
  | 'facebook'
  | 'reddit';

export interface SocialLink {
  type: SocialPlatform;
  url: string;
  username?: string;
}

/** Domain → platform mapping */
const PLATFORM_DOMAINS: { pattern: RegExp; type: SocialPlatform }[] = [
  { pattern: /(?:^|\.)instagram\.com/i, type: 'instagram' },
  { pattern: /(?:^|\.)twitter\.com/i, type: 'twitter' },
  { pattern: /(?:^|\.)x\.com/i, type: 'twitter' },
  { pattern: /(?:^|\.)youtube\.com/i, type: 'youtube' },
  { pattern: /(?:^|\.)behance\.net/i, type: 'behance' },
  { pattern: /(?:^|\.)dribbble\.com/i, type: 'dribbble' },
  { pattern: /(?:^|\.)linktr\.ee/i, type: 'linktree' },
  { pattern: /(?:^|\.)github\.com/i, type: 'github' },
  { pattern: /(?:^|\.)pinterest\.com/i, type: 'pinterest' },
  { pattern: /(?:^|\.)pin\.it/i, type: 'pinterest' },
  { pattern: /(?:^|\.)facebook\.com/i, type: 'facebook' },
  { pattern: /(?:^|\.)reddit\.com/i, type: 'reddit' },
];

/** Extract all URLs from text */
export function extractUrls(text: string): string[] {
  // Matches http(s):// URLs and www. URLs
  const regex = /https?:\/\/[^\s<>\"']+|www\.[^\s<>\"']+/gi;
  return text.match(regex) || [];
}

/** Split text into parts (plain text and URL objects) for rendering clickable links */
export function getBioParts(text: string): (string | { url: string })[] {
  if (!text) return [];
  // Use capturing group to keep the delimiters in the split result
  const regex = /(https?:\/\/[^\s<>\"']+|www\.[^\s<>\"']+)/gi;
  return text.split(regex).map(part => {
    if (part.match(regex)) {
      return { url: part };
    }
    return part;
  }).filter(Boolean);
}

/** Normalize a raw URL string (ensure https://) */
function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (url.startsWith('www.')) url = 'https://' + url;
  // Remove trailing punctuation that might be part of sentence
  url = url.replace(/[.,;:!?)]+$/, '');
  return url;
}

/**
 * Format a URL for display in the bio.
 * - Strips protocol (http/https)
 * - Keeps domain
 * - Shows only the first segment of the path if it exists
 * - Truncates to ~30 characters
 */
export function formatDisplayUrl(url: string): string {
  try {
    // Ensure it's a valid URL for the URL constructor
    const normalized = normalizeUrl(url);
    const urlObj = new URL(normalized);
    
    // 1. Strip protocol and www
    let display = urlObj.hostname.replace(/^www\./, '');
    
    // 2. Add first path segment if it exists
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      display += '/' + pathSegments[0];
      // If there are more segments or query params/hash, add ellipsis
      if (pathSegments.length > 1 || urlObj.search || urlObj.hash || urlObj.pathname.endsWith('/')) {
        display += '…';
      }
    }
    
    // 3. Max length truncation
    if (display.length > 30) {
      return display.substring(0, 27) + '…';
    }
    
    return display;
  } catch {
    // Fallback if URL parsing fails
    let fallback = url.replace(/^https?:\/\/(www\.)?/, '').trim();
    if (fallback.length > 30) {
      return fallback.substring(0, 27) + '…';
    }
    return fallback;
  }
}

/** Detect platform from a URL string. Returns null if unrecognized. */
export function detectPlatform(rawUrl: string): SocialPlatform | null {
  try {
    const url = new URL(normalizeUrl(rawUrl));
    const hostname = url.hostname.replace(/^www\./, '');
    for (const { pattern, type } of PLATFORM_DOMAINS) {
      if (pattern.test(hostname)) return type;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/** Best-effort username extraction from a social URL */
export function extractUsername(rawUrl: string, platform: SocialPlatform): string | undefined {
  try {
    const url = new URL(normalizeUrl(rawUrl));
    const path = url.pathname.replace(/^\//, '').replace(/\/$/, '');
    
    // Skip non-profile paths
    const skipSegments = [
      'explore', 'search', 'settings', 'about', 'help',
      'watch', 'channel', 'playlist', 'results', 'feed',
      'hashtag', 'stories', 'reels', 'live', 'p',
      'gallery', 'shots', 'tags', 'boards', 'pin',
      'pages', 'groups', 'events', 'marketplace',
    ];

    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return undefined;

    const firstSegment = segments[0].toLowerCase();
    if (skipSegments.includes(firstSegment)) return undefined;

    // Platform-specific extraction
    switch (platform) {
      case 'instagram':
      case 'twitter':
      case 'github':
      case 'dribbble':
      case 'pinterest':
      case 'facebook':
      case 'behance':
        // Username is typically the first path segment
        return segments[0].replace(/^@/, '');

      case 'linktree':
        return segments[0];

      case 'youtube':
        // Handle /c/username, /user/username, /@username, /channel/ID
        if (segments[0] === 'c' || segments[0] === 'user') {
          return segments[1] || undefined;
        }
        if (segments[0].startsWith('@')) {
          return segments[0].replace('@', '');
        }
        if (segments[0] === 'channel') {
          return segments[1] || undefined;
        }
        return segments[0];

      case 'reddit':
        // Handle /user/username or /u/username
        if (segments[0] === 'user' || segments[0] === 'u') {
          return segments[1] || undefined;
        }
        return segments[0];

      default:
        return segments[0];
    }
  } catch {
    return undefined;
  }
}

/** Detect the FIRST eligible (unconverted) social link in bio text */
export function detectFirstEligibleLink(
  bioText: string,
  existingLinks: SocialLink[]
): { url: string; rawUrl: string; platform: SocialPlatform; username?: string } | null {
  const urls = extractUrls(bioText);
  const existingTypes = new Set(existingLinks.map(l => l.type));

  for (const rawUrl of urls) {
    const platform = detectPlatform(rawUrl);
    if (platform && !existingTypes.has(platform)) {
      const username = extractUsername(rawUrl, platform);
      return { url: normalizeUrl(rawUrl), rawUrl, platform, username };
    }
  }
  return null;
}

/** Remove a specific URL from bio text, cleaning up extra whitespace */
export function removeUrlFromBio(bio: string, url: string): string {
  // Escape special regex chars in the URL
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Also try without trailing slash
  const withoutSlash = escaped.replace(/\\\/$/, '');
  const pattern = new RegExp(`\\s*(?:${escaped}|${withoutSlash})\\s*`, 'g');
  return bio.replace(pattern, ' ').trim();
}

/** Platform display metadata */
export const PLATFORM_META: Record<SocialPlatform, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: '#E4405F' },
  twitter: { label: 'X(Twitter)', color: '#000000' },
  youtube: { label: 'YouTube', color: '#FF0000' },
  behance: { label: 'Behance', color: '#1769FF' },
  dribbble: { label: 'Dribbble', color: '#EA4C89' },
  linktree: { label: 'Linktree', color: '#43E55E' },
  github: { label: 'GitHub', color: '#181717' },
  pinterest: { label: 'Pinterest', color: '#BD081C' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  reddit: { label: 'Reddit', color: '#FF4500' },
};
