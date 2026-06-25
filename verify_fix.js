const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFilter(lobs) {
  console.log(`Testing filter for: ${JSON.stringify(lobs)}`);
  
  const { data, count, error } = await supabase
    .from('temp_leads_basics')
    .select('id, policy_type', { count: 'exact' })
    .in('policy_type', lobs);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Results found: ${count}`);
  if (data.length > 0) {
    console.log('Sample Data:', data.slice(0, 2));
  }
}

async function runTests() {
  await testFilter(['auto']);
  await testFilter(['home_auto']);
  await testFilter(['auto', 'home_auto']);
  await testFilter(['Motorcycle']);
  await testFilter(['bop']);
}

runTests();
