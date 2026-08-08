import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a standard Supabase client.
// We query the public profiles table which contains the email for each user.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check the profiles table for the email using the public API.
    // The profiles table stores emails and is indexed/accessible.
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Error checking email availability:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // If data exists, the email is taken.
    const isAvailable = !data;

    return NextResponse.json({ available: isAvailable }, { status: 200 });
  } catch (error) {
    console.error('API /check-email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
