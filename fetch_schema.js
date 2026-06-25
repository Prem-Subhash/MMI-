const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Query information_schema using postgres function if available, 
  // or just try fetching a row and see its keys.
  const { data: intakeData, error } = await supabase
    .from('temp_intake_forms')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching table data:', error);
    return;
  }
  
  if (intakeData && intakeData.length > 0) {
    console.log('Columns in temp_intake_forms:', Object.keys(intakeData[0]));
  } else {
    console.log('No rows found, cannot determine schema from select *. Trying to insert dummy and rollback? Not ideal.');
  }
}

run();
