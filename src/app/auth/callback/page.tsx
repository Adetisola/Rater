"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getProfileById, persistProfileUpdate } from '@/lib/profiles';

function AuthCallbackContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        // 1. Ensure session is established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error("No active session found.");

        const user = session.user;

        // 2. Fetch profile
        const profile = await getProfileById(user.id);

        // 3. Create profile if missing
        if (!profile) {
          const metadata = user.user_metadata || {};
          const fullName = metadata.full_name || metadata.name || 'Anonymous User';
          const avatarUrl = metadata.avatar_url || metadata.picture || null;

          // Generate a unique temporary username using the reserved 'user_' prefix
          // Using a combination of timestamp and short id guarantees uniqueness and prevents squatting on good names.
          const shortId = user.id.slice(0, 6);
          const timestamp = Date.now().toString(36).slice(-4);
          const tempUsername = `user_${timestamp}${shortId}`;

          // Create the profile with onboarding_completed = false
          await persistProfileUpdate(user.id, {
            name: fullName,
            username: tempUsername,
            avatar_url: avatarUrl,
            bg_color: '#FEC312',
            onboarding_completed: false,
          });

          // Redirect to complete profile since it's a new signup
          if (mounted) router.replace('/auth/complete-profile');
          return;
        }

        // 4. If profile exists, check if onboarding is completed
        const hasValidUsername = profile.username && !profile.username.startsWith('user_') && !profile.username.startsWith('temp_');
        
        if (!profile.onboarding_completed && !hasValidUsername) {
          if (mounted) router.replace('/auth/complete-profile');
        } else {
          // Auto-heal legacy accounts that have a username but missing the completed flag
          if (!profile.onboarding_completed && hasValidUsername) {
             await persistProfileUpdate(user.id, { onboarding_completed: true });
          }
          if (mounted) router.replace('/browse');
        }

      } catch (err: any) {
        console.error("OAuth Callback Error:", err);
        if (mounted) setError(err.message || "Authentication failed");
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
        <p className="text-gray-500 mb-6 text-center">{error}</p>
        <button 
          onClick={() => router.push('/browse')}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
