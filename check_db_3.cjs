require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url')
    .ilike('name', 'Tester%');
    
  console.log(JSON.stringify(data, null, 2));
}

check();
