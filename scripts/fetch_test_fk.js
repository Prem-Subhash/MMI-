const fs = require('fs');
const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';

async function run() {
    const query = 'id,pipeline_id,current_stage_id,profiles!temp_leads_basics_assigned_csr_fkey(full_name)';
    const res = await fetch(`${supabaseUrl}/rest/v1/temp_leads_basics?select=${encodeURIComponent(query)}&limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });

    if (!res.ok) {
        console.error(await res.json());
    } else {
        console.log("SUCCESS:", await res.json());
    }
}
run().catch(console.error);
