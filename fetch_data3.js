const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'sb_publishable_kuXMaWMsxrNuBi3YPPudRg_VjSaOdb7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: leadsData } = await supabase.from('leads').select('*').limit(5);
  console.log('Sample leads in leads table:', leadsData);
}

run();
