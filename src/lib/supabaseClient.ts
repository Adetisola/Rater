import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Graceful fallback warning in development mode.
  // This allows the app to compile and run mock data even if the developer hasn't created a .env.local file yet.
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. ' +
      'Please copy .env.example to .env.local and populate them to connect to your live database.'
    );
  }
}

// Initialize the Supabase Client singleton.
// In non-browser environments (like SSR/Build scripts), this returns a hollow instance if variables are absent.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
