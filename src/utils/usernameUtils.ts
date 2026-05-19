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

  if (!existingNormalized.includes(base)) {
    return base;
  }

  // Handle collision with incrementing suffix
  let counter = 1;
  let candidate = `${base}_${counter}`;
  
  while (existingNormalized.includes(candidate)) {
    counter++;
    candidate = `${base}_${counter}`;
  }

  return candidate;
}
