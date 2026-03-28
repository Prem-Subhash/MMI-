import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data: stages, error: err3 } = await supabase
        .from('pipeline_stages')
        .select('id, pipeline_id, stage_name');

    if (err3) console.error("STAGES ERROR:", err3);

    const { data: leads, error: err2 } = await supabase
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
            profiles:assigned_csr (
                full_name
            )
        `)
        .limit(5);

    if (err2) {
        console.error("LEADS ERROR OBJECT:");
        console.dir(err2, { depth: null });
    }

    fs.writeFileSync('out_stages.json', JSON.stringify({ stages, leads }, null, 2));
    console.log("Saved to out_stages.json");
}

testFetch();
