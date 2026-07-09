import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username')
    .ilike('name', 'Tester%');
    
  console.log("Profiles matching 'Tester%':", data);
}

check();
