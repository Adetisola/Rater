import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const email = 'adetisola.timilehin@gmail.com';
  console.log('Checking profiles for:', email);
  const { data: profileData, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, username')
    .eq('email', email);
  
  console.log('Profiles data:', profileData);
  if (profileErr) console.error('Profiles error:', profileErr);

  console.log('\nFetching all users to see if it exists in auth.users but not profiles...');
  const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
  if (authErr) {
    console.error('Auth error:', authErr);
  } else {
    const user = users.find(u => u.email === email);
    console.log('User in auth.users:', user ? `Found (ID: ${user.id})` : 'Not found');
  }
}

main();
