const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const leadId = 'a0c85c6c-0c32-4fc2-8929-4b9e269a7239';
  const intakeId = '82ca1c5a-16b9-4443-a1e1-f4de23a69b21';

  console.log('--- DB AUDIT (SERVICE ROLE) ---');
  
  const { data: leadData } = await supabase
    .from('temp_leads_basics')
    .select('id, client_name, insurence_category, policy_type, policy_flow')
    .eq('id', leadId)
    .single();
  console.log('\n1. temp_leads_basics:', leadData);

  const { data: lpData } = await supabase
    .from('lead_policies')
    .select('*')
    .eq('lead_id', leadId);
  console.log('\n2. lead_policies:', lpData);

  const { data: intakeData } = await supabase
    .from('temp_intake_forms')
    .select('id, lead_id, form_type, status')
    .eq('id', intakeId)
    .single();
  console.log('\n3. temp_intake_forms:', intakeData);

  // also query EmailModal's exact query
  const { data: exactLeadData, error: exactError } = await supabase
    .from('temp_leads_basics')
    .select(`
      id,
      policy_type,
      lead_policies(policy_type)
    `)
    .eq('id', leadId)
    .single();
    
  console.log('\n4. EmailModal Exact Query Result:', exactLeadData);
  if (exactError) console.error('Error:', exactError);
}

run();
