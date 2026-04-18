"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { MOCK_AVATARS, type Avatar } from '../logic/mockData';

interface AuthContextType {
  currentAvatar: Avatar | null;
  allAvatars: Record<string, Avatar>;
  login: (name: string, passkey: string) => Promise<boolean>;
  signup: (name: string, passkey: string, avatar_url?: string) => Promise<boolean>;
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

  const login = useCallback(async (nameOrUsername: string, passkey: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const query = nameOrUsername.toLowerCase().trim();
    const avatar = Object.values(allAvatars).find(
      a => (a.name.toLowerCase() === query || a.username.toLowerCase() === query) && a.passkey === passkey
    );

    if (avatar) {
      if (avatar.is_blocked) return false;
      setCurrentAvatar(avatar);
      localStorage.setItem('rater_avatar_id', avatar.id);
      return true;
    }
    return false;
  }, [allAvatars]);

  const signup = useCallback(async (name: string, passkey: string, avatar_url?: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    let baseUsername = name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^\x00-\x7F]/g, "") // strip non-ascii (like emojis)
      .replace(/[^\w\s]/g, '') // strip special characters except _ and alphanumeric
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();

    if (!baseUsername) baseUsername = 'user';

    let username = baseUsername;
    let counter = 1;
    let usernameTaken = true;
    
    const existing = Object.values(allAvatars).map(a => a.username.toLowerCase());
    
    while (usernameTaken) {
        if (existing.includes(username)) {
            username = `${baseUsername}_${counter}`;
            counter++;
        } else {
            usernameTaken = false;
        }
    }

    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const newAvatar: Avatar = {
      id: newId,
      username,
      name: name.trim(),
      role: 'Designer',
      passkey,
      avatar_url,
      bg_color: ['#FEC312', '#7C3BED', '#3B82F6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)],
      is_blocked: false,
      created_at: new Date().toISOString()
    };

    setSessionAvatars(prev => ({ ...prev, [newId]: newAvatar }));
    setCurrentAvatar(newAvatar);
    localStorage.setItem('rater_avatar_id', newId);
    return true;
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

    let updatedAvatar = { ...currentAvatar, ...data };

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

        // 2. Cooldown enforcement
        const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
        if (currentAvatar.usernameLastChangedAt) {
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
        updatedAvatar.usernameLastChangedAt = Date.now();
      }
    }

    // Trim display name
    if (data.name !== undefined) {
      updatedAvatar.name = data.name.trim().slice(0, 50);
    }

    // Update local context state
    setCurrentAvatar(updatedAvatar);

    // Persist changes based on origin
    if (updatedAvatar.id.startsWith('avatar_session_')) {
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

