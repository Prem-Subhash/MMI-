import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    let query = supabase
        .from('temp_leads_basics')
        .select(`
            id,
            current_stage:pipeline_stages!inner (
            stage_name
            )
        `)
        .eq('insurence_category', 'commercial')
        .eq('policy_flow', 'new')
        .eq('current_stage.stage_name', 'Quoting in Progress');

    const { data, error } = await query;
    if (error) {
        console.error("QUERY ERROR:", JSON.stringify(error, null, 2));
    } else {
        console.log("QUERY SUCCESS, LEADS COUNT:", data?.length);
    }
}
testFetch();
