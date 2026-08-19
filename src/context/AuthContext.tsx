"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Avatar } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { 
  getProfileById, 
  resolveIdentifierToEmail, 
  checkUsernameAvailable as dbCheckUsername,
  persistProfileUpdate,
  ProfileCache
} from '@/lib/profiles';
import { validateSignupInput } from '@/utils/validation';
import { generateUsernameFromName } from '@/utils/usernameUtils';
import { getPlatformSettingPublic } from '@/lib/admin/server';

interface AuthState {
  currentProfile: Avatar | null;
  profileMap: Record<string, Avatar>; // Kept for backwards compatibility until M3
  isLoading: boolean;
  isSuspended: boolean;
}

interface AuthActions {
  login: (identifier: string, passkey: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, passkey: string, avatar_url?: string, username?: string, role?: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: Partial<Avatar>) => Promise<{ ok: true } | { ok: false; error: string }>;
  loginWithGoogle: () => Promise<void>;
  connectGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  checkUsernameAvailable: (username: string, excludeAvatarId?: string) => Promise<boolean>;
  dismissSuspendedNotice: () => void;
}

const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthActionsContext = createContext<AuthActions | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentProfile, setCurrentProfile] = useState<Avatar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  const dismissSuspendedNotice = useCallback(() => {
    setIsSuspended(false);
  }, []);

  const handleBlockedEviction = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Signout during eviction (ignoring):", err);
    }
    setCurrentProfile(null);
    setIsSuspended(true);
  }, []);

  // 1. Initial Session Check (Flicker-free & block-aware)
  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          const profile = await getProfileById(session.user.id);
          if (profile?.is_blocked) {
            await supabase.auth.signOut();
            if (mounted) {
              setCurrentProfile(null);
              setIsSuspended(true);
            }
            return;
          }
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

    // 2. Auth State Listener — also enforces block status on session events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentProfile(null);
      } else if (session?.user?.id) {
        const profile = await getProfileById(session.user.id);
        if (profile?.is_blocked) {
          // Blocked users are immediately ejected, even if they have a valid token
          await supabase.auth.signOut();
          setCurrentProfile(null);
          setIsSuspended(true);
          return;
        }
        if (profile) setCurrentProfile(profile);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 3. Multi-tier Session Enforcement for Active Logged-In User
  useEffect(() => {
    if (!currentProfile?.id) return;

    const profileId = currentProfile.id;

    // A. Realtime subscription for prompt push eviction
    const channel = supabase
      .channel(`profile-block-watch:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profileId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as { is_blocked?: boolean }).is_blocked) {
            handleBlockedEviction();
          }
        }
      )
      .subscribe();

    // B. Re-verification query helper
    const checkBlockStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_blocked')
          .eq('id', profileId)
          .single();

        if (!error && data?.is_blocked) {
          handleBlockedEviction();
        }
      } catch (err) {
        console.warn("Block status verification check failed:", err);
      }
    };

    // C. Window focus & tab visibility listeners
    const handleFocus = () => checkBlockStatus();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkBlockStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // D. 60-Second fallback poll
    const pollInterval = setInterval(checkBlockStatus, 60000);

    return () => {
      channel.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, [currentProfile?.id, handleBlockedEviction]);

  const login = useCallback(async (identifier: string, passkey: string): Promise<{ ok: boolean; error?: string }> => {
    const email = await resolveIdentifierToEmail(identifier, passkey);
    if (!email) return { ok: false };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passkey
    });

    if (error || !data.user) return { ok: false };

    // Enforce block: fetch profile and reject if account is suspended
    const profile = await getProfileById(data.user.id);
    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      setIsSuspended(true);
      return { ok: false, error: 'Your account has been suspended. Please contact support if you believe this is a mistake.' };
    }

    return { ok: true };
  }, []);

  const signup = useCallback(async (
    name: string, 
    email: string, 
    passkey: string, 
    avatar_url?: string, 
    username?: string, 
    role?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    // 0. Platform gate check
    try {
      const signupSetting = await getPlatformSettingPublic('signup_enabled');
      if (signupSetting && signupSetting.enabled === false) {
        return { ok: false, error: 'New user registrations are currently disabled.' };
      }
    } catch {
      // Allow fallback if setting query fails
    }

    // 1. Pre-flight format validation
    const validationError = validateSignupInput(username || name, email, passkey);
    if (validationError) return { ok: false, error: validationError };

    // 2. Determine final username
    let finalUsername = username?.trim();
    if (!finalUsername) {
      // Generate one and check if available
      finalUsername = generateUsernameFromName(name, []);
    }

    finalUsername = finalUsername.toLowerCase();
    
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
        }
      }
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    // 3. Save the base64 avatar directly to the profile table
    if (avatar_url && authData.user) {
      await supabase
        .from('profiles')
        .update({ avatar_url })
        .eq('id', authData.user.id);
        
      // Re-fetch to guarantee state is synced
      ProfileCache.invalidate(authData.user.id);
      const updated = await getProfileById(authData.user.id);
      if (updated) setCurrentProfile(updated);
    }

    return { ok: true };
  }, []);

  const updateProfile = useCallback(async (data: Partial<Avatar>) => {
    if (!currentProfile) return { ok: false, error: "Not logged in" } as const;
    const result = await persistProfileUpdate(currentProfile.id, data);
    if (result.ok && result.data) {
      setCurrentProfile(result.data);
    }
    return result;
  }, [currentProfile]);

  // Provide a proxy for profileMap so UI can read from cache synchronously without causing re-renders
  const safeProfileMap = useMemo(() => {
     return new Proxy({} as Record<string, Avatar>, {
       get: (_, prop) => {
         if (typeof prop === 'string') {
            return ProfileCache.get(prop) || undefined;
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

  const stateValue = useMemo(() => ({
    currentProfile,
    profileMap: safeProfileMap,
    isLoading,
    isSuspended
  }), [currentProfile, safeProfileMap, isLoading, isSuspended]);

  const actionsValue = useMemo(() => ({
    login,
    signup,
    updateProfile,
    checkUsernameAvailable: dbCheckUsername,
    loginWithGoogle,
    connectGoogle,
    logout,
    dismissSuspendedNotice
  }), [login, signup, updateProfile, loginWithGoogle, connectGoogle, logout, dismissSuspendedNotice]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
}

export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within an AuthProvider');
  }
  return context;
}
