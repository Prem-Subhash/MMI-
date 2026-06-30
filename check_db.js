require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function check() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('temp_leads_basics')
    .select('policy_type')
    .not('policy_type', 'is', null)
    .limit(20);
    
  if (error) console.error(error);
  
  const { data: lpData, error: lpError } = await supabase
    .from('lead_policies')
    .select('policy_type')
    .limit(20);
    
  console.log("temp_leads_basics policy_type:");
  console.log(JSON.stringify(data, null, 2));
  
  console.log("lead_policies policy_type:");
  console.log(JSON.stringify(lpData, null, 2));
}

check();
