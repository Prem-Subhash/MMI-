const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://welhzcasuabhqoccfxtu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g'
);

async function main() {
    const { data: leads, error } = await supabase
        .from('temp_leads_basics')
        .select(`
            id,
            client_name,
            phone,
            email,
            insurence_category,
            policy_flow,
            pipeline_id,
            current_stage_id,
            created_at,
            assigned_csr,
            current_stage:pipeline_stages (
                stage_name
            ),
            csr:csrs!temp_leads_assigned_csr_fkey (
                name
            )
        `)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("ERROR:", error);
    } else {
        console.log("FIRST LEAD FULL OBJECT:", JSON.stringify(leads?.[0], null, 2));
    }
}

main();
