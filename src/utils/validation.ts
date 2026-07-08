export const RESERVED_USERNAMES = [
  'admin', 'support', 'settings', 'explore', 'browse', 'submit',
  'login', 'signup', 'post', 'api', 'insights', 'rater', 'null', 'undefined', 'home'
];

/**
 * Normalizes a username by trimming whitespace and converting to lowercase.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Validates if a username format is acceptable (alphanumeric and underscores).
 */
export function isValidUsernameFormat(username: string): boolean {
  // 3-20 characters, alphanumeric and underscores only
  const regex = /^[a-z0-9_]{3,20}$/;
  return regex.test(username);
}

/**
 * Checks if a normalized username is reserved.
 */
export function isReservedUsername(normalizedUsername: string): boolean {
  return RESERVED_USERNAMES.includes(normalizedUsername);
}

/**
 * Basic email format validation
 */
export function isValidEmailFormat(email: string): boolean {
  // Note: extremely robust email validation should be done server-side, 
  // but this catches basic malformed inputs on the client.
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Comprehensive pre-flight check for signup.
 * Returns an error string if invalid, or null if valid.
 */
export function validateSignupInput(
  username: string,
  email: string,
  passkey: string
): string | null {
  const normalizedUsername = normalizeUsername(username);

  if (!isValidUsernameFormat(normalizedUsername)) {
    return 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.';
  }

  if (isReservedUsername(normalizedUsername)) {
    return 'This username is reserved and cannot be used.';
  }

  if (!isValidEmailFormat(email)) {
    return 'Please enter a valid email address.';
  }

  if (passkey.length < 8) {
    return 'Passkey must be at least 8 characters long.';
  }

  return null; // Valid
}
