const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('id, policy_type, body')
    .eq('name', 'info_req')
    .eq('insurance_category', 'personal');

  if (error) {
    console.error('Error fetching template:', error);
  } else {
    data.forEach(t => {
      console.log('---');
      console.log(`ID: ${t.id}`);
      console.log(`Policy: ${t.policy_type}`);
      console.log(`Body (First 500): ${t.body.substring(0, 500)}...`);
    });
  }
}

run();
