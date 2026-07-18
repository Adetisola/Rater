"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Avatar } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { 
  getProfileById, 
  resolveIdentifierToEmail, 
  checkUsernameAvailable as dbCheckUsername,
  persistProfileUpdate,
  clearProfileCache,
  profileCache
} from '@/lib/profiles';
import { validateSignupInput } from '@/utils/validation';
import { generateUsernameFromName } from '@/utils/usernameUtils';

interface AuthContextType {
  currentProfile: Avatar | null;
  profileMap: Record<string, Avatar>; // Kept for backwards compatibility until M3
  login: (identifier: string, passkey: string) => Promise<boolean>;
  signup: (name: string, email: string, passkey: string, avatar_url?: string, username?: string, role?: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: Partial<Avatar>) => Promise<{ ok: true } | { ok: false; error: string }>;
  loginWithGoogle: () => Promise<void>;
  connectGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  checkUsernameAvailable: (username: string, excludeAvatarId?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentProfile, setCurrentProfile] = useState<Avatar | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Session Check (Flicker-free)
  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          const profile = await getProfileById(session.user.id);
          if (mounted && profile) {
            setCurrentProfile(profile);
          }
        }
      } catch (error) {
        console.error("Auth session initialization error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initializeSession();

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentProfile(null);
        // We intentionally don't call clearProfileCache() here anymore.
        // It holds public profiles for the feed. If we clear it, the feed shows 'unknown' avatars!
      } else if (session?.user?.id) {
        const profile = await getProfileById(session.user.id);
        if (profile) setCurrentProfile(profile);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (identifier: string, passkey: string): Promise<boolean> => {
    const email = await resolveIdentifierToEmail(identifier, passkey);
    if (!email) return false;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passkey
    });

    return !error;
  }, []);

  const signup = useCallback(async (
    name: string, 
    email: string, 
    passkey: string, 
    avatar_url?: string, 
    username?: string, 
    role?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    
    // 1. Pre-flight format validation
    const validationError = validateSignupInput(username || name, email, passkey);
    if (validationError) return { ok: false, error: validationError };

    // 2. Determine final username
    let finalUsername = username?.trim();
    if (!finalUsername) {
      // Generate one and check if available
      finalUsername = generateUsernameFromName(name, []);
    }

    const isAvailable = await dbCheckUsername(finalUsername);
    if (!isAvailable) {
      return { ok: false, error: 'Username is already taken.' };
    }

    // 3. Supabase Auth Signup
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password: passkey,
      options: {
        data: {
          name,
          username: finalUsername,
          role: role || 'user',
          bg_color: '#FEC312',
          onboarding_completed: true,
          // Do not put avatar_url here, it's a huge base64 string that breaks JWT size limits
        }
      }
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    // 4. Save the base64 avatar directly to the profile table
    // The handle_new_user trigger creates the profile synchronously during signUp
    if (avatar_url && authData.user) {
      await supabase
        .from('profiles')
        .update({ avatar_url })
        .eq('id', authData.user.id);
        
      // Re-fetch to guarantee state is synced
      clearProfileCache();
      const updated = await getProfileById(authData.user.id);
      if (updated) setCurrentProfile(updated);
    }

    return { ok: true };
  }, []);

  const updateProfile = useCallback(async (data: Partial<Avatar>) => {
    if (!currentProfile) return { ok: false, error: "Not logged in" } as const;
    const result = await persistProfileUpdate(currentProfile.id, data);
    if (result.ok) {
      // Re-fetch to guarantee state is synced
      const updated = await getProfileById(currentProfile.id);
      if (updated) setCurrentProfile(updated);
    }
    return result;
  }, [currentProfile]);

  // Provide a proxy for profileMap so UI can read from cache synchronously
  const safeProfileMap = useMemo(() => {
     return new Proxy({}, {
       get: (_target, prop) => {
         if (typeof prop === 'string') {
            return profileCache[prop] || undefined;
         }
         return undefined;
       }
     });
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }, []);

  const connectGoogle = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false, error: "No email associated with current account." };

    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/settings`,
        queryParams: {
          login_hint: user.email
        }
      }
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut().catch(error => {
      console.warn("Signout network error (can be ignored):", error);
    });
  }, []);

  const contextValue = useMemo(() => ({ 
    currentProfile, 
    profileMap: safeProfileMap, 
    login, 
    signup, 
    updateProfile, 
    checkUsernameAvailable: dbCheckUsername,
    loginWithGoogle,
    connectGoogle,
    logout, 
    isLoading 
  }), [
    currentProfile,
    safeProfileMap,
    login,
    signup,
    updateProfile,
    loginWithGoogle,
    connectGoogle,
    logout,
    isLoading
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
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
