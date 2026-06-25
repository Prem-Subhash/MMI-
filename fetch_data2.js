const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'sb_publishable_kuXMaWMsxrNuBi3YPPudRg_VjSaOdb7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: allLeads } = await supabase.from('temp_leads_basics').select('*').limit(5);
  console.log('Sample leads in DB:', allLeads.map(l => l.id));
  
  const leadId = 'a0c85c6c-0c32-4fc2-8929-4b9e269a7239';
  const { data: lpData } = await supabase.from('lead_policies').select('*').limit(5);
  console.log('Sample lead_policies in DB:', lpData);
}

run();
