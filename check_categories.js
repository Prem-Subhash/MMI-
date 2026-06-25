const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCategories() {
  const { data, error } = await supabase
    .from('temp_leads_basics')
    .select('insurence_category')
    .limit(1000);

  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }

  const uniqueCategories = [...new Set(data.map(i => i.insurence_category))];
  console.log('Unique Categories in DB:', uniqueCategories);
}

checkCategories();
