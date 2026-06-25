const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('temp_intake_forms')
    .select('*')
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(5);

  if (error) {
    console.error('Error fetching temp_intake_forms:', error);
  } else {
    // If we want newest created, there is no created_at column?
    // Let's just fetch all and find the one that has active_policies if any
    const { data: allData } = await supabase.from('temp_intake_forms').select('*');
    if (allData && allData.length > 0) {
      console.log('Most recent record:', allData[allData.length - 1]);
    } else {
      console.log('No records found');
    }
  }
}

run();
