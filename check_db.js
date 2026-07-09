require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'tester_4');
  console.log("tester_4:", data, error);

  const { data: data2, error: err2 } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'tester_3');
  console.log("tester_3:", data2, err2);
}

check();
