const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'sb_publishable_kuXMaWMsxrNuBi3YPPudRg_VjSaOdb7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const leadId = 'a0c85c6c-0c32-4fc2-8929-4b9e269a7239';
  const intakeId = '82ca1c5a-16b9-4443-a1e1-f4de23a69b21';

  console.log('1. Fetching temp_leads_basics for lead_id:', leadId);
  const { data: leadData, error: leadError } = await supabase
    .from('temp_leads_basics')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();

  if (leadError) console.error('Error:', leadError);
  else console.log('temp_leads_basics:', leadData);

  console.log('\n2. Fetching lead_policies for lead_id:', leadId);
  const { data: lpData, error: lpError } = await supabase
    .from('lead_policies')
    .select('*')
    .eq('lead_id', leadId);

  if (lpError) console.error('Error:', lpError);
  else console.log('lead_policies:', lpData);

  console.log('\n3. Fetching temp_intake_forms for intake_id:', intakeId);
  const { data: intakeData, error: intakeError } = await supabase
    .from('temp_intake_forms')
    .select('*')
    .eq('id', intakeId)
    .maybeSingle();

  if (intakeError) console.error('Error:', intakeError);
  else console.log('temp_intake_forms:', intakeData);
}

run();
