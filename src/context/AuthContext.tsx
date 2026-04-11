"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_AVATARS, type Avatar } from '../logic/mockData';

interface AuthContextType {
  currentUser: Avatar | null;
  allAvatars: Record<string, Avatar>;
  login: (name: string, passkey: string) => Promise<boolean>;
  signup: (name: string, passkey: string, avatarUrl?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Avatar | null>(null);
  const [sessionAvatars, setSessionAvatars] = useState<Record<string, Avatar>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Merge static mock avatars with newly created session avatars
  const allAvatars = { ...MOCK_AVATARS, ...sessionAvatars };

  // Load session and dynamic avatars from localStorage on mount
  useEffect(() => {
    const savedSessionAvatars = localStorage.getItem('rater_session_avatars');
    if (savedSessionAvatars) {
      setSessionAvatars(JSON.parse(savedSessionAvatars));
    }

    const savedUserId = localStorage.getItem('rater_user_id');
    if (savedUserId) {
      // Re-fetch from the merged list
      const merged = { ...MOCK_AVATARS, ...(savedSessionAvatars ? JSON.parse(savedSessionAvatars) : {}) };
      if (merged[savedUserId]) {
        setCurrentUser(merged[savedUserId]);
      }
    }
    setIsLoading(false);
  }, []);

  // Save session avatars to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(sessionAvatars).length > 0) {
      localStorage.setItem('rater_session_avatars', JSON.stringify(sessionAvatars));
    }
  }, [sessionAvatars]);

  const login = useCallback(async (name: string, passkey: string): Promise<boolean> => {
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const avatar = Object.values(allAvatars).find(
      a => a.name.toLowerCase() === name.toLowerCase().trim() && a.passkey === passkey
    );

    if (avatar) {
      setCurrentUser(avatar);
      localStorage.setItem('rater_user_id', avatar.id);
      return true;
    }
    return false;
  }, [allAvatars]);

  const signup = useCallback(async (name: string, passkey: string, avatarUrl?: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if name taken
    const exists = Object.values(allAvatars).some(
      a => a.name.toLowerCase() === name.toLowerCase().trim()
    );

    if (exists) return false;

    const newId = `user_session_${Date.now()}`;
    const newAvatar: Avatar = {
      id: newId,
      name: name.trim(),
      passkey,
      avatarUrl,
      bgColor: ['#FEC312', '#7C3BED', '#3B82F6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)],
      isBlocked: false
    };

    setSessionAvatars(prev => ({ ...prev, [newId]: newAvatar }));
    setCurrentUser(newAvatar);
    localStorage.setItem('rater_user_id', newId);
    return true;
  }, [allAvatars]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('rater_user_id');
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, allAvatars, login, signup, logout, isLoading }}>
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
