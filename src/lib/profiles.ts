/**
 * Profiles Domain Service
 *
 * All profile operations go through this file.
 * Handles operations for Supabase Profiles.
 */

import type { Avatar } from '@/types';
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

// Promise cache for deduplicating concurrent network requests
const pendingProfilePromises: Record<string, Promise<Avatar | null>> = (globalThis as any).__pendingProfilePromises || {};
(globalThis as any).__pendingProfilePromises = pendingProfilePromises;

export function populateProfileCache(profiles: Partial<Avatar>[]) {
  profiles.forEach(p => {
    if (!p.id || !p.username) return;
    profileCache[p.id] = { ...profileCache[p.id], ...(p as Avatar) };
    profileByUsernameCache[p.username.toLowerCase()] = { ...profileByUsernameCache[p.username.toLowerCase()], ...(p as Avatar) };
  });
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fetch a single profile by ID.
 * 1. Memory Cache (only if complete)
 * 2. Supabase `profiles` table
 */
export async function getProfileById(id: string): Promise<Avatar | null> {
  if (profileCache[id] && profileCache[id].created_at) return profileCache[id];

  const cacheKey = `id:${id}`;
  if (pendingProfilePromises[cacheKey]) return pendingProfilePromises[cacheKey];

  const promise = (async () => {
    // Check Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, show_email, name, role, avatar_url, bg_color, is_admin, bio, is_blocked, created_at, username_last_changed_at, previous_usernames, social_links, onboarding_completed')
      .eq('id', id)
      .single();

    delete pendingProfilePromises[cacheKey];

    if (!error && data) {
      const profile = data as Avatar;
      // Merge with any existing partial data just in case
      profileCache[id] = { ...profileCache[id], ...profile };
      profileByUsernameCache[profile.username.toLowerCase()] = profileCache[id];
      return profileCache[id];
    }

    // If we only have a partial profile, return that as a last resort
    if (profileCache[id]) return profileCache[id];

    return null;
  })();

  pendingProfilePromises[cacheKey] = promise;
  return promise;
}

/**
 * Fetch a single profile by username (for profile route rendering).
 */
export async function getProfileByUsername(username: string): Promise<Avatar | null> {
  const normalized = normalizeUsername(username);
  
  if (profileByUsernameCache[normalized] && profileByUsernameCache[normalized].created_at) {
    return profileByUsernameCache[normalized];
  }

  const cacheKey = `username:${normalized}`;
  if (pendingProfilePromises[cacheKey]) return pendingProfilePromises[cacheKey];

  const promise = (async () => {
    // Check Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, show_email, name, role, avatar_url, bg_color, is_admin, bio, is_blocked, created_at, username_last_changed_at, previous_usernames, social_links, onboarding_completed')
      .eq('username', normalized)
      .limit(1)
      .maybeSingle();

    delete pendingProfilePromises[cacheKey];

    if (!error && data) {
      const profile = data as Avatar;
      profileCache[profile.id] = { ...profileCache[profile.id], ...profile };
      profileByUsernameCache[normalized] = profileCache[profile.id];
      return profileCache[profile.id];
    }

    // If we only have a partial profile, return that as a last resort
    if (profileByUsernameCache[normalized]) return profileByUsernameCache[normalized];

    return null;
  })();

  pendingProfilePromises[cacheKey] = promise;
  return promise;
}

/**
 * Resolves a login identifier (email or username) to an email.
 * If it's a username, it queries the DB to find the associated email.
 */
export async function resolveIdentifierToEmail(identifier: string, passkey?: string): Promise<string | null> {
  if (!identifier) return null;

  let normalized = identifier.trim().toLowerCase();
  
  // Extract username if they typed /@username
  const urlMatch = normalized.match(/\/@([a-z0-9_.]+)/);
  if (urlMatch) {
    normalized = urlMatch[1];
  } else {
    normalized = normalized.replace(/^@/, '');
  }

  // If it's already an email, just return it
  if (normalized.includes('@')) {
    return normalized;
  }

  // It's a username. We need the passkey to securely resolve it.
  if (!passkey) {
    return null; // Cannot securely resolve username without password
  }

  // Securely query Supabase RPC to find the email for this username
  // The RPC verifies the password before returning the email to prevent enumeration
  const { data, error } = await supabase.rpc('get_email_for_login', {
    p_username: normalized,
    p_password: passkey
  });

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Check whether a username is available.
 */
export async function checkUsernameAvailable(
  username: string,
  excludeId?: string
): Promise<boolean> {
  const normalized = normalizeUsername(username);

  let query = supabase.from('profiles').select('id').eq('username', normalized);
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data } = await query.limit(1).maybeSingle();
  
  // If there's no error and data is null, username is available
  return !data;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Persist profile updates to the database.
 */
export async function persistProfileUpdate(
  userId: string,
  updates: Partial<Avatar>
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Security safeguard: Strip sensitive fields that should never be updated directly via the client
  const safeUpdates = { ...updates };
  delete safeUpdates.is_admin;
  delete safeUpdates.role;
  delete safeUpdates.is_blocked;

  const { error } = await supabase
    .from('profiles')
    .update(safeUpdates)
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
