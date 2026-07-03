import { supabase } from '../lib/supabaseClient';
import { safeQueryExecute, type ServiceResponse } from './baseService';
import type { Avatar } from '@/types';

export const authService = {
  /**
   * Resolves email associated with a username.
   * Useful since Supabase Auth natively requires email logins.
   */
  async getEmailByUsername(username: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle();

    if (error || !data) return null;
    return data.email;
  },

  /**
   * Sign In using email or username identifier.
   */
  async signIn(identifier: string, passkey: string): Promise<ServiceResponse<any>> {
    let email = identifier.trim();

    // If identifier is not a standard email, treat it as username and resolve email.
    if (!email.includes('@')) {
      const resolvedEmail = await this.getEmailByUsername(email);
      if (!resolvedEmail) {
        return {
          ok: false,
          data: null,
          error: 'No account matching this username was found.',
        };
      }
      email = resolvedEmail;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passkey,
    });

    if (error) {
      return {
        ok: false,
        data: null,
        error: error.message,
      };
    }

    return {
      ok: true,
      data,
      error: null,
    };
  },

  /**
   * Sign Up a new designer profile.
   * Leverages Supabase Auth, storing metadata which triggers automated profiles trigger inserts.
   */
  async signUp(
    name: string,
    email: string,
    passkey: string,
    username: string,
    role?: string,
    avatarUrl?: string
  ): Promise<ServiceResponse<any>> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: passkey,
      options: {
        data: {
          username: username.trim().toLowerCase(),
          name: name.trim(),
          role: role || null,
          avatar_url: avatarUrl || null,
          bg_color: ['#FEC312', '#7C3BED', '#3B82F6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)],
        },
      },
    });

    if (error) {
      return {
        ok: false,
        data: null,
        error: error.message,
      };
    }

    return {
      ok: true,
      data,
      error: null,
    };
  },

  /**
   * Logs out the current user session.
   */
  async signOut(): Promise<ServiceResponse<void>> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        ok: false,
        data: null,
        error: error.message,
      };
    }
    return {
      ok: true,
      data: null,
      error: null,
    };
  },

  /**
   * Checks if username is taken in public profiles.
   */
  async checkUsernameAvailable(username: string, excludeUserId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('username', username.toLowerCase().trim())
      .neq('id', excludeUserId);

    if (error) return false;
    return count === 0;
  },

  /**
   * Updates an existing profile row in public.profiles.
   * Standardized to use our base query response framework.
   */
  async updateProfile(userId: string, updates: Partial<Avatar>): Promise<ServiceResponse<Avatar>> {
    return safeQueryExecute<Avatar>(
      supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
    );
  },

  /**
   * Fetches the complete profile associated with a specific username.
   */
  async fetchProfileByUsername(username: string): Promise<ServiceResponse<Avatar>> {
    return safeQueryExecute<Avatar>(
      supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .single()
    );
  }
};
