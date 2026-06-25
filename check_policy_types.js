const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPolicyTypes() {
  const { data, error } = await supabase
    .from('temp_leads_basics')
    .select('policy_type')
    .limit(1000);

  if (error) {
    console.error('Error fetching policy types:', error);
    return;
  }

  const uniqueTypes = [...new Set(data.map(i => i.policy_type))];
  console.log('Unique Policy Types in DB:', uniqueTypes);
}

checkPolicyTypes();
