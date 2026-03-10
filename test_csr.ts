import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data: leads, error: err2 } = await supabase
        .from('temp_leads_basics')
        .select(`
            id,
            assigned_csr,
            csrs!temp_leads_basics_assigned_csr_fkey (
                name
            )
        `)
        .not('assigned_csr', 'is', null)
        .limit(2);

    console.log("LEADS FETCHED:", JSON.stringify(leads, null, 2));
    if (err2) console.error("ERROR:", err2);
}
testFetch();
