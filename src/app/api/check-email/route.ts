import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase admin client using the service role key to bypass RLS.
// This allows us to securely check the auth.users table or profiles table for email existence
// without exposing sensitive user data to the client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check the auth.users table for the email using the admin API.
    // This is the absolute source of truth for registered emails in Supabase.
    // We fetch a list of users matching the search string (the email).
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (error) {
      console.error('Error checking email availability:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Check if any user exactly matches the normalized email
    const isAvailable = !users.some(u => u.email?.toLowerCase() === normalizedEmail);

    return NextResponse.json({ available: isAvailable }, { status: 200 });
  } catch (error) {
    console.error('API /check-email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
