"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { MOCK_AVATARS, type Avatar } from '../logic/mockData';

interface AuthContextType {
  currentAvatar: Avatar | null;
  allAvatars: Record<string, Avatar>;
  login: (name: string, passkey: string) => Promise<boolean>;
  signup: (name: string, passkey: string, avatar_url?: string) => Promise<boolean>;
  updateProfile: (data: Partial<Avatar>) => Promise<void>;
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

    const username = name.trim().toLowerCase().replace(/\s+/g, '_');
    const exists = Object.values(allAvatars).some(
      a => a.username === username || a.name.toLowerCase() === name.toLowerCase().trim()
    );

    if (exists) return false;

    const newId = `avatar_session_${Date.now()}`;
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

  const updateProfile = useCallback(async (data: Partial<Avatar>) => {
    if (!currentAvatar) return;
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedAvatar = { ...currentAvatar, ...data };
    
    // Update local context state
    setCurrentAvatar(updatedAvatar);

    // Persist changes based on origin
    if (updatedAvatar.id.startsWith('avatar_session_')) {
      setSessionAvatars(prev => ({ ...prev, [updatedAvatar.id]: updatedAvatar }));
    } else {
      // Immutable update for mock data (DB emulation)
      setMockOverrides(prev => ({ ...prev, [updatedAvatar.id]: updatedAvatar }));
    }
  }, [currentAvatar]);

  const logout = useCallback(() => {
    setCurrentAvatar(null);
    localStorage.removeItem('rater_avatar_id');
  }, []);

  return (
    <AuthContext.Provider value={{ currentAvatar, allAvatars, login, signup, updateProfile, logout, isLoading }}>
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

