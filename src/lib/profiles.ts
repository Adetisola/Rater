/**
 * Profiles Domain Service
 *
 * All profile operations go through this file.
 * Handles operations for Supabase Profiles.
 */

import { cache } from 'react';
import type { Avatar } from '@/types';
import { supabase } from './supabase/client';
import { normalizeUsername } from '@/utils/validation';

// ─── Client Cache API ──────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: Avatar;
  timestamp: number;
  /** True when fetched with the full column set (getProfileById / getProfileByUsername).
   *  False for partial profiles populated from post/review joins. */
  isComplete: boolean;
}

// Client-only map. Server environments will not populate this, avoiding global memory leaks.
const clientCache = new Map<string, CacheEntry>();
const pendingPromises = new Map<string, Promise<Avatar | null>>();

export const ProfileCache = {
  /**
   * Read a cached profile. Returns any cached data (complete or partial).
   * UI components (PostCard, SearchResults, profileMap Proxy) use this for
   * best-effort display without an extra network call.
   */
  get: (idOrUsername: string): Avatar | null => {
    if (typeof window === 'undefined') return null; // Strict client-only cache
    const key = idOrUsername.toLowerCase();
    const entry = clientCache.get(key);
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      clientCache.delete(key);
      return null;
    }
    return entry.data;
  },

  /**
   * Read a cached profile only if it was stored as a complete entry.
   * Used by getProfileById / getProfileByUsername so that partial profiles
   * from post/review joins never short-circuit a full DB fetch.
   */
  getComplete: (idOrUsername: string): Avatar | null => {
    if (typeof window === 'undefined') return null;
    const key = idOrUsername.toLowerCase();
    const entry = clientCache.get(key);
    if (!entry || !entry.isComplete) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      clientCache.delete(key);
      return null;
    }
    return entry.data;
  },
  
  set: (profile: Partial<Avatar> & { id?: string }, isComplete = false) => {
    if (typeof window === 'undefined' || !profile?.id) return;
    const key = profile.id.toLowerCase();
    
    // Merge with existing data so partial updates don't erase fields
    const existing = clientCache.get(key);
    const mergedData = existing ? { ...existing.data, ...profile } as Avatar : profile as Avatar;
    // Promote to complete if this write is complete, or preserve existing completeness
    const nowComplete = isComplete || (existing?.isComplete ?? false);
    
    const entry: CacheEntry = { data: mergedData, timestamp: Date.now(), isComplete: nowComplete };
    clientCache.set(key, entry);
    if (mergedData.username) {
      clientCache.set(mergedData.username.toLowerCase(), entry);
    }
  },
  
  invalidate: (idOrUsername: string) => {
    if (typeof window === 'undefined') return;
    const key = idOrUsername.toLowerCase();
    const entry = clientCache.get(key);
    if (entry) {
      clientCache.delete(entry.data.id.toLowerCase());
      if (entry.data.username) {
         clientCache.delete(entry.data.username.toLowerCase());
      }
    }
    clientCache.delete(key);
  },
  
  clear: () => {
    if (typeof window !== 'undefined') {
      clientCache.clear();
      pendingPromises.clear();
    }
  },

  // Expose a safe readonly map for legacy synchronous access in UI (e.g. SearchResults)
  // This map contains all currently valid cached profiles.
  getSafeMap: (): Record<string, Avatar> => {
    if (typeof window === 'undefined') return {};
    const map: Record<string, Avatar> = {};
    const now = Date.now();
    clientCache.forEach((entry, key) => {
        if (now - entry.timestamp <= CACHE_TTL_MS) {
           map[key] = entry.data;
        } else {
           clientCache.delete(key);
        }
    });
    return map;
  }
};

export function populateProfileCache(profiles: Partial<Avatar>[]) {
  profiles.forEach(p => {
    if (p.id) {
       ProfileCache.set(p, false); // Explicitly partial
    }
  });
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fetch a single profile by ID.
 * 1. Client Cache — only if a COMPLETE entry exists (partial join data won't short-circuit)
 * 2. In-flight promise deduplication (Client)
 * 3. React cache() deduplication (Server)
 * 4. Supabase `profiles` table
 */
export const getProfileById = cache(async (id: string): Promise<Avatar | null> => {
  const cached = ProfileCache.getComplete(id);
  if (cached) return cached;

  const promiseKey = `id:${id}`;
  if (typeof window !== 'undefined' && pendingPromises.has(promiseKey)) {
    return pendingPromises.get(promiseKey)!;
  }

  const promise = (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, show_email, name, role, avatar_url, bg_color, is_admin, bio, is_blocked, created_at, username_last_changed_at, previous_usernames, social_links, onboarding_completed')
      .eq('id', id)
      .single();

    if (typeof window !== 'undefined') pendingPromises.delete(promiseKey);

    if (!error && data) {
      const profile = data as Avatar;
      ProfileCache.set(profile, true); // Mark as complete
      return profile;
    }

    return null;
  })();

  if (typeof window !== 'undefined') {
    pendingPromises.set(promiseKey, promise);
  }

  return promise;
});

/**
 * Fetch a single profile by username (for profile route rendering).
 */
export const getProfileByUsername = cache(async (username: string): Promise<Avatar | null> => {
  const normalized = normalizeUsername(username);
  
  const cached = ProfileCache.getComplete(normalized);
  if (cached) return cached;

  const promiseKey = `username:${normalized}`;
  if (typeof window !== 'undefined' && pendingPromises.has(promiseKey)) {
    return pendingPromises.get(promiseKey)!;
  }

  const promise = (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, show_email, name, role, avatar_url, bg_color, is_admin, bio, is_blocked, created_at, username_last_changed_at, previous_usernames, social_links, onboarding_completed')
      .eq('username', normalized)
      .limit(1)
      .maybeSingle();

    if (typeof window !== 'undefined') pendingPromises.delete(promiseKey);

    if (!error && data) {
      const profile = data as Avatar;
      ProfileCache.set(profile, true); // Mark as complete
      return profile;
    }

    return null;
  })();

  if (typeof window !== 'undefined') {
    pendingPromises.set(promiseKey, promise);
  }

  return promise;
});

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

  // Explicit cache invalidation
  ProfileCache.invalidate(userId);
  if (updates.username) {
     ProfileCache.invalidate(updates.username);
  }

  return { ok: true };
}
