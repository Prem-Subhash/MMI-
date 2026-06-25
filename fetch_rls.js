const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching RLS policies for lead_policies table...');
  const { data, error } = await supabase
    .rpc('get_policies_for_table', { table_name: 'lead_policies' });
    
  // Since we might not have the rpc, let's just use raw query via a postgrest if possible, 
  // or we can just fetch via REST API or assume standard authenticated RLS if rpc fails.
  // Actually, we can just try to fetch a policy directly using the system views, but Supabase JS client
  // doesn't support querying pg_catalog directly easily without an RPC.
  // Let's try to do it by creating an RPC or just fetching.
  // We can just rely on the fact that we proved anonymous cannot read it (it returned [] for anon and rows for service_role).
}

run();
