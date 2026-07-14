import { RESERVED_ROUTES } from '../lib/constants';

/**
 * Normalizes a name string for use as a base username.
 * - Lowercase
 * - Remove emojis and special characters (except underscore)
 * - Replace spaces with underscores
 * 
 * "John Doe ✨" -> "john_doe"
 */
export function normalizeNameForUsername(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\x00-\x7F]/g, "")   // Remove non-ascii (emojis, etc)
    .replace(/[^\w\s]/g, '')        // Remove special chars except word/space
    .trim()
    .replace(/\s+/g, '_')           // Replace spaces with underscore
    .toLowerCase();
}

/**
 * Generates a unique username from a display name given a list of existing usernames.
 */
export function generateUsernameFromName(name: string, existingUsernames: string[]): string {
  let base = normalizeNameForUsername(name);
  
  if (!base) {
    base = 'user';
  } else if (base.length < 3) {
    base = base.padEnd(3, '1');
  } else if (base.length > 15) {
    base = base.slice(0, 15).replace(/_$/, '');
  }

  const existingNormalized = existingUsernames.map(u => u.toLowerCase());

  if (!existingNormalized.includes(base) && !RESERVED_ROUTES.has(base)) {
    return base;
  }

  // Handle collision with incrementing suffix (e.g. daniel2)
  let counter = 2;
  let candidate = `${base}${counter}`;
  
  while (existingNormalized.includes(candidate) || RESERVED_ROUTES.has(candidate)) {
    counter++;
    candidate = `${base}${counter}`;
  }

  return candidate;
}

// Local cache for async availability checks to avoid duplicate queries
const availabilityCache = new Map<string, boolean>();

/**
 * Asynchronously generates an available username by checking against reserved routes and the database.
 */
export async function generateAvailableUsernameAsync(
  name: string,
  checkAvailability: (username: string) => Promise<boolean>,
  abortSignal?: AbortSignal
): Promise<string> {
  let base = normalizeNameForUsername(name);
  
  if (!base || base.length < 3) {
    return 'username'; // default placeholder if name is too short or invalid
  }
  
  if (base.length > 15) {
    base = base.slice(0, 15).replace(/_$/, '');
  }

  const checkIsAvailable = async (candidate: string) => {
    if (RESERVED_ROUTES.has(candidate)) return false;
    if (availabilityCache.has(candidate)) return availabilityCache.get(candidate);
    
    try {
      const isFree = await checkAvailability(candidate);
      availabilityCache.set(candidate, isFree);
      return isFree;
    } catch (e) {
      // In case of error, default to unavailable to be safe
      return false;
    }
  };

  let isAvailable = await checkIsAvailable(base);
  if (abortSignal?.aborted) return base;

  if (isAvailable) return base;

  let counter = 2;
  let candidate = `${base}${counter}`;
  
  while (!(await checkIsAvailable(candidate))) {
    if (abortSignal?.aborted) return candidate;
    counter++;
    candidate = `${base}${counter}`;
  }

  return candidate;
}
