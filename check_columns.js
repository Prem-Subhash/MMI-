const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
  const { data, error } = await supabase
    .from('temp_leads_basics')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching columns:', error);
    return;
  }

  console.log('Columns in temp_leads_basics:', Object.keys(data[0]));
}

checkColumns();
