import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data, error } = await supabase
        .from('temp_leads_basics')
        .select(`id, client_name, insurence_category, policy_flow, current_stage_id, assigned_csr, pipeline_stages(stage_name)`)
        .eq('insurence_category', 'commercial');

    if (error) console.error("ERROR:", error);
    fs.writeFileSync('commercial_leads_dump.json', JSON.stringify(data, null, 2));
}
testFetch();
