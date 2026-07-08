/**
 * Profiles Domain Service
 *
 * All profile operations go through this file.
 * Handles the transition from mock data to Supabase Profiles.
 */

import type { Avatar } from '@/types';
import { MOCK_AVATARS } from '@/logic/mockData';
import { supabase } from './supabase/client';
import { normalizeUsername } from '@/utils/validation';

// ─── Caches ───────────────────────────────────────────────────────────────────

// Tiny memory cache to avoid redundant profile fetches across routes
export const profileCache: Record<string, Avatar> = (globalThis as any).__profileCache || {};
(globalThis as any).__profileCache = profileCache;

const profileByUsernameCache: Record<string, Avatar> = (globalThis as any).__profileByUsernameCache || {};
(globalThis as any).__profileByUsernameCache = profileByUsernameCache;

// Session cache mapping username -> email to avoid redundant lookups on login
const usernameToEmailCache: Record<string, string> = (globalThis as any).__usernameToEmailCache || {};
(globalThis as any).__usernameToEmailCache = usernameToEmailCache;

export function populateProfileCache(profiles: Avatar[]) {
  profiles.forEach(p => {
    profileCache[p.id] = p;
    profileByUsernameCache[p.username.toLowerCase()] = p;
  });
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fetch a single profile by ID.
 * Priority: 
 * 1. Memory Cache
 * 2. Supabase `profiles` table
 * 3. `MOCK_AVATARS` fallback (for legacy mock posts referencing 'alex', 'sam')
 */
export async function getProfileById(id: string): Promise<Avatar | null> {
  if (profileCache[id]) return profileCache[id];

  // Check Supabase
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!error && data) {
    const profile = data as Avatar;
    profileCache[id] = profile;
    profileByUsernameCache[profile.username.toLowerCase()] = profile;
    return profile;
  }

  // Fallback to legacy mock avatars
  if (MOCK_AVATARS[id]) {
    profileCache[id] = MOCK_AVATARS[id];
    return MOCK_AVATARS[id];
  }

  return null;
}

/**
 * Fetch a single profile by username (for profile route rendering).
 */
export async function getProfileByUsername(username: string): Promise<Avatar | null> {
  const normalized = normalizeUsername(username);
  
  if (profileByUsernameCache[normalized]) {
    return profileByUsernameCache[normalized];
  }

  // Check Supabase
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', normalized)
    .single();

  if (!error && data) {
    const profile = data as Avatar;
    profileCache[profile.id] = profile;
    profileByUsernameCache[normalized] = profile;
    return profile;
  }

  // Fallback to legacy mock avatars
  const mockFallback = Object.values(MOCK_AVATARS).find(a => a.username.toLowerCase() === normalized);
  if (mockFallback) {
    profileCache[mockFallback.id] = mockFallback;
    profileByUsernameCache[normalized] = mockFallback;
    return mockFallback;
  }

  return null;
}

/**
 * Resolves a login identifier (email or username) to an email.
 * If it's a username, it queries the DB to find the associated email.
 */
export async function resolveIdentifierToEmail(identifier: string): Promise<string | null> {
  let normalized = identifier.trim().toLowerCase();
  
  // Extract username if they typed /@username
  const urlMatch = normalized.match(/\/@([a-z0-9_]+)/);
  if (urlMatch) {
    normalized = urlMatch[1];
  } else {
    normalized = normalized.replace(/^@/, '');
  }

  // If it's already an email, just return it
  if (normalized.includes('@')) {
    return normalized;
  }

  // It's a username. Check our lookup cache.
  if (usernameToEmailCache[normalized]) {
    return usernameToEmailCache[normalized];
  }

  // Query Supabase to find the email for this username
  // NOTE: In production, exposing email by username might be a privacy leak if anyone can query it.
  // For Rater's current setup, we allow it for the login flow.
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', normalized)
    .single();

  if (error || !data || !data.email) {
    return null;
  }

  usernameToEmailCache[normalized] = data.email.toLowerCase();
  return data.email;
}

/**
 * Check whether a username is available.
 */
export async function checkUsernameAvailable(
  username: string,
  excludeId?: string
): Promise<boolean> {
  const normalized = normalizeUsername(username);

  // Check legacy mock users first to prevent conflicts during transition phase
  const mockConflict = Object.values(MOCK_AVATARS).some(
    a => a.username.toLowerCase() === normalized && a.id !== excludeId
  );
  if (mockConflict) return false;

  let query = supabase.from('profiles').select('id').eq('username', normalized);
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  
  // If there's no error and data length is 0, username is available
  return !error && (!data || data.length === 0);
}

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Persist profile updates to the database.
 */
export async function persistProfileUpdate(
  userId: string,
  updates: Partial<Avatar>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  // Update memory caches
  if (profileCache[userId]) {
    const oldUsername = profileCache[userId].username.toLowerCase();
    profileCache[userId] = { ...profileCache[userId], ...updates };
    
    // Update username cache if username changed
    if (updates.username) {
      delete profileByUsernameCache[oldUsername];
      profileByUsernameCache[updates.username.toLowerCase()] = profileCache[userId];
    } else {
      profileByUsernameCache[oldUsername] = profileCache[userId];
    }
  }

  return { ok: true };
}

/**
 * Clear the profile cache (called on logout)
 */
export function clearProfileCache(): void {
  for (const key in profileCache) delete profileCache[key];
  for (const key in profileByUsernameCache) delete profileByUsernameCache[key];
  for (const key in usernameToEmailCache) delete usernameToEmailCache[key];
}
