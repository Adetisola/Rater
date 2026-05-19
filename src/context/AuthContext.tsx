"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Avatar } from '@/types';
// TODO(backend): Replace MOCK_AVATARS with Supabase auth + avatars table.
// All localStorage persistence below (rater_session_avatars, rater_mock_overrides,
// rater_avatar_id) should be replaced with Supabase session management.
import { MOCK_AVATARS } from '../logic/mockData';
import { generateUsernameFromName } from '../utils/usernameUtils';

interface AuthContextType {
  currentAvatar: Avatar | null;
  allAvatars: Record<string, Avatar>;
  login: (identifier: string, passkey: string) => Promise<boolean>;
  signup: (name: string, email: string, passkey: string, avatar_url?: string, username?: string, role?: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: Partial<Avatar>) => Promise<{ ok: true } | { ok: false; error: string }>;
  checkUsernameAvailable: (username: string, excludeId: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentAvatar, setCurrentAvatar] = useState<Avatar | null>(null);
  const [sessionAvatars, setSessionAvatars] = useState<Record<string, Avatar>>({});
  const [mockOverrides, setMockOverrides] = useState<Record<string, Avatar>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Source of truth for designers in the app
  const allAvatars = useMemo(() => ({
    ...MOCK_AVATARS,
    ...mockOverrides,
    ...sessionAvatars
  }), [mockOverrides, sessionAvatars]);

  // Sync with LocalStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('rater_session_avatars');
    const savedOverrides = localStorage.getItem('rater_mock_overrides');
    const savedAvatarId = localStorage.getItem('rater_avatar_id');

    if (savedSession) setSessionAvatars(JSON.parse(savedSession));
    if (savedOverrides) setMockOverrides(JSON.parse(savedOverrides));

    if (savedAvatarId) {
       // We'll let the user effect handle the actual resolution after states are set
    }
    setIsLoading(false);
  }, []);

  // Resolve current avatar after storage loads
  useEffect(() => {
    if (isLoading) return;
    const savedAvatarId = localStorage.getItem('rater_avatar_id');
    if (savedAvatarId && allAvatars[savedAvatarId]) {
      setCurrentAvatar(allAvatars[savedAvatarId]);
    }
  }, [allAvatars, isLoading]);

  // Persist edits
  useEffect(() => {
    if (Object.keys(sessionAvatars).length > 0) {
      localStorage.setItem('rater_session_avatars', JSON.stringify(sessionAvatars));
    }
    if (Object.keys(mockOverrides).length > 0) {
      localStorage.setItem('rater_mock_overrides', JSON.stringify(mockOverrides));
    }
  }, [sessionAvatars, mockOverrides]);

  const login = useCallback(async (identifier: string, passkey: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Normalize: strip @, extract from profile URLs, trim, lowercase
    let normalized = identifier.trim().toLowerCase();
    
    // Handle pasted profile URLs (e.g. "rater.app/@timmycodes")
    const urlMatch = normalized.match(/\/@([a-z0-9_]+)/);
    if (urlMatch) {
      normalized = urlMatch[1];
    } else {
      // Strip leading @
      normalized = normalized.replace(/^@/, '');
    }

    // Lookup by username OR email
    const avatar = Object.values(allAvatars).find(
      a => (a.username.toLowerCase() === normalized || a.email?.toLowerCase() === normalized) && a.passkey === passkey
    );

    if (avatar) {
      if (avatar.is_blocked) return false;
      setCurrentAvatar(avatar);
      localStorage.setItem('rater_avatar_id', avatar.id);
      return true;
    }
    return false;
  }, [allAvatars]);

  const signup = useCallback(async (name: string, email: string, passkey: string, avatar_url?: string, username?: string, role?: string): Promise<{ ok: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const existingUsernames = Object.values(allAvatars).map(a => a.username.toLowerCase());
    const existingEmails = Object.values(allAvatars).map(a => a.email?.toLowerCase()).filter(Boolean);
    
    const normalizedEmail = email.trim().toLowerCase();

    if (existingEmails.includes(normalizedEmail)) {
      return { ok: false, error: 'Email already in use' };
    }

    // Use provided username or generate one based on name.
    // If a provided username is already taken (race condition), use the utility to generate a unique variant.
    let finalUsername = username?.trim() || generateUsernameFromName(name, existingUsernames);
    if (username && existingUsernames.includes(finalUsername.toLowerCase())) {
        finalUsername = generateUsernameFromName(finalUsername, existingUsernames);
    }

    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newAvatar: Avatar = {
      id: newId,
      username: finalUsername,
      email: normalizedEmail,
      name: name.trim(),
      role: role || 'Designer',
      passkey,
      avatar_url,
      bg_color: ['#FEC312', '#7C3BED', '#3B82F6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)],
      is_blocked: false,
      created_at: new Date().toISOString(),
      usernameLastChangedAt: undefined // Explicitly undefined until claimed
    };

    setSessionAvatars(prev => ({ ...prev, [newId]: newAvatar }));
    setCurrentAvatar(newAvatar);
    localStorage.setItem('rater_avatar_id', newId);
    return { ok: true };
  }, [allAvatars]);

  const checkUsernameAvailable = useCallback(async (username: string, excludeId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const normalized = username.toLowerCase().trim();
    return !Object.values(allAvatars).some(
      a => a.id !== excludeId && a.username.toLowerCase() === normalized
    );
  }, [allAvatars]);

  const updateProfile = useCallback(async (data: Partial<Avatar>): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!currentAvatar) return { ok: false, error: 'Not authenticated.' };
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedAvatar = { ...currentAvatar, ...data };

    // --- Username change enforcement ---
    if (data.username !== undefined) {
      const newUsername = data.username.toLowerCase().trim();
      const oldUsername = currentAvatar.username.toLowerCase();

      if (newUsername !== oldUsername) {
        // 1. Uniqueness check (case-insensitive, server-side)
        const isTaken = Object.values(allAvatars).some(
          a => a.id !== currentAvatar.id && a.username.toLowerCase() === newUsername
        );
        if (isTaken) return { ok: false, error: 'Username already taken.' };

        // 2. Cooldown enforcement (only if not a claim/skip from onboarding)
        const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
        if (currentAvatar.usernameLastChangedAt && currentAvatar.usernameLastChangedAt > 1) {
          const elapsed = Date.now() - currentAvatar.usernameLastChangedAt;
          if (elapsed < COOLDOWN_MS) {
            const daysRemaining = Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
            return { ok: false, error: `Username can be changed again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.` };
          }
        }

        // 3. Push old username to history
        updatedAvatar.previousUsernames = [
          ...(currentAvatar.previousUsernames ?? []),
          currentAvatar.username,
        ];
        updatedAvatar.username = newUsername;
        // set to Date.now() unless we are explicitly setting a "claim" flag value (like 1)
        updatedAvatar.usernameLastChangedAt = data.usernameLastChangedAt || Date.now();
      }
    } else if (data.usernameLastChangedAt !== undefined) {
      updatedAvatar.usernameLastChangedAt = data.usernameLastChangedAt;
    }

    // Trim display name
    if (data.name !== undefined) {
      updatedAvatar.name = data.name.trim().slice(0, 50);
    }

    // Update local context state
    setCurrentAvatar(updatedAvatar);

    // Persist changes based on origin
    if (updatedAvatar.id.startsWith('user_')) {
      setSessionAvatars(prev => ({ ...prev, [updatedAvatar.id]: updatedAvatar }));
    } else {
      setMockOverrides(prev => ({ ...prev, [updatedAvatar.id]: updatedAvatar }));
    }

    return { ok: true };
  }, [currentAvatar, allAvatars]);

  const logout = useCallback(() => {
    setCurrentAvatar(null);
    localStorage.removeItem('rater_avatar_id');
  }, []);

  return (
    <AuthContext.Provider value={{ currentAvatar, allAvatars, login, signup, updateProfile, checkUsernameAvailable, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

