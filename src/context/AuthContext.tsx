"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Avatar } from '@/types';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/authService';
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
  const [dbAvatars, setDbAvatars] = useState<Record<string, Avatar>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch user profile from public.profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (isMounted) {
          if (profile) {
            setCurrentAvatar(profile as Avatar);
          } else {
            // Fallback to user metadata if profile not created yet by trigger
            const metadata = session.user.user_metadata;
            setCurrentAvatar({
              id: session.user.id,
              username: metadata.username || 'user',
              email: session.user.email || '',
              name: metadata.name || 'New Member',
              role: metadata.role || null,
              avatar_url: metadata.avatar_url || undefined,
              bg_color: metadata.bg_color || '#FEC312',
              is_blocked: false,
              passkey: '',
              created_at: session.user.created_at,
            });
          }
        }
      } else {
        if (isMounted) {
          setCurrentAvatar(null);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch all profiles and subscribe to live changes
  useEffect(() => {
    let isMounted = true;

    const fetchAllProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*');
      if (isMounted && data) {
        const avatarsMap = data.reduce((acc: Record<string, Avatar>, profile: any) => {
          acc[profile.id] = profile as Avatar;
          return acc;
        }, {});
        setDbAvatars(avatarsMap);
      }
    };
    
    fetchAllProfiles();

    const channel = supabase
      .channel('live-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as Avatar;
            setDbAvatars(prev => ({
              ...prev,
              [updated.id]: updated
            }));
            
            // Also update currentAvatar if it's the current user's profile
            setCurrentAvatar(current => {
              if (current && current.id === updated.id) {
                return updated;
              }
              return current;
            });
          } else if (payload.eventType === 'DELETE') {
            setDbAvatars(prev => {
              const next = { ...prev };
              delete next[(payload.old as any).id];
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const login = useCallback(async (identifier: string, passkey: string): Promise<boolean> => {
    const res = await authService.signIn(identifier, passkey);
    return res.ok;
  }, []);

  const signup = useCallback(async (
    name: string,
    email: string,
    passkey: string,
    avatar_url?: string,
    username?: string,
    role?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const existingUsernames = Object.values(dbAvatars).map(a => a.username.toLowerCase());
    let finalUsername = username?.trim() || generateUsernameFromName(name, existingUsernames);
    if (username && existingUsernames.includes(finalUsername.toLowerCase())) {
      finalUsername = generateUsernameFromName(finalUsername, existingUsernames);
    }

    const res = await authService.signUp(name, email, passkey, finalUsername, role, avatar_url);
    if (!res.ok) {
      return { ok: false, error: res.error || 'Failed to sign up.' };
    }
    return { ok: true };
  }, [dbAvatars]);

  const checkUsernameAvailable = useCallback(async (username: string, excludeId: string): Promise<boolean> => {
    return authService.checkUsernameAvailable(username, excludeId);
  }, []);

  const updateProfile = useCallback(async (data: Partial<Avatar>): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!currentAvatar) return { ok: false, error: 'Not authenticated.' };

    const updates: Partial<Avatar> = {};

    // --- Username change enforcement ---
    if (data.username !== undefined) {
      const newUsername = data.username.toLowerCase().trim();
      const oldUsername = currentAvatar.username.toLowerCase();

      if (newUsername !== oldUsername) {
        // 1. Uniqueness check
        const isAvailable = await authService.checkUsernameAvailable(newUsername, currentAvatar.id);
        if (!isAvailable) return { ok: false, error: 'Username already taken.' };

        // 2. Cooldown enforcement
        const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
        if (currentAvatar.username_last_changed_at && currentAvatar.username_last_changed_at !== '1') {
          const lastChanged = new Date(currentAvatar.username_last_changed_at).getTime();
          const elapsed = Date.now() - lastChanged;
          if (elapsed < COOLDOWN_MS) {
            const daysRemaining = Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
            return { ok: false, error: `Username can be changed again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.` };
          }
        }

        // 3. Push old username to history
        updates.previous_usernames = [
          ...(currentAvatar.previous_usernames ?? []),
          currentAvatar.username,
        ];
        updates.username = newUsername;
        updates.username_last_changed_at = data.username_last_changed_at || new Date().toISOString();
      }
    } else if (data.username_last_changed_at !== undefined) {
      updates.username_last_changed_at = data.username_last_changed_at;
    }

    if (data.name !== undefined) {
      updates.name = data.name.trim().slice(0, 50);
    }
    if (data.bio !== undefined) {
      updates.bio = data.bio;
    }
    if (data.role !== undefined) {
      updates.role = data.role;
    }
    if (data.avatar_url !== undefined) {
      updates.avatar_url = data.avatar_url;
    }
    if (data.bg_color !== undefined) {
      updates.bg_color = data.bg_color;
    }
    if (data.social_links !== undefined) {
      updates.social_links = data.social_links;
    }

    const res = await authService.updateProfile(currentAvatar.id, updates);
    if (!res.ok) {
      return { ok: false, error: res.error || 'Failed to update profile.' };
    }

    return { ok: true };
  }, [currentAvatar]);

  const logout = useCallback(async () => {
    await authService.signOut();
    setCurrentAvatar(null);
  }, []);

  const allAvatars = useMemo(() => dbAvatars, [dbAvatars]);

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
