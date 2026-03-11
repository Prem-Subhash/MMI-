const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';

async function run() {
    const query = 'id,client_name,phone,email,insurence_category,policy_flow,pipeline_id,current_stage_id,created_at,assigned_csr,current_stage:pipeline_stages(stage_name),profiles:assigned_csr(full_name)';

    console.log("Fetching leads with join...");
    const res = await fetch(`${supabaseUrl}/rest/v1/temp_leads_basics?select=${encodeURIComponent(query)}&order=created_at.desc`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });

    if (!res.ok) {
        console.error("Error Response:", await res.json());
        return;
    }
}

run().catch(console.error);
