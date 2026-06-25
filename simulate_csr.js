const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const intakeId = '82ca1c5a-16b9-4443-a1e1-f4de23a69b21';
  
  // Simulate what EmailModal does now for this lead
  const { data, error } = await supabase
    .from('temp_intake_forms')
    .update({ active_policies: ['home', 'auto'] })
    .eq('id', intakeId)
    .select()
    .single();

  console.log('Updated temp_intake_forms:', data);
  if (error) console.error(error);
}

run();
