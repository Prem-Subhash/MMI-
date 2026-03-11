import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    // Test key 1
    const { data: leads1, error: err1 } = await supabase
        .from('temp_leads_basics')
        .select(`
            id,
            csr1:csrs!temp_leads_basics_assigned_csr_fkey (name)
        `)
        .not('assigned_csr', 'is', null)
        .limit(1);

    console.log("TEST 1 - temp_leads_basics_assigned_csr_fkey:", JSON.stringify(leads1, null, 2));
    if (err1) console.log("TEST 1 ERROR:", err1.message);

    // Test key 2
    const { data: leads2, error: err2 } = await supabase
        .from('temp_leads_basics')
        .select(`
            id,
            csr2:csrs!temp_leads_assigned_csr_fkey (name)
        `)
        .not('assigned_csr', 'is', null)
        .limit(1);

    console.log("TEST 2 - temp_leads_assigned_csr_fkey:", JSON.stringify(leads2, null, 2));
    if (err2) console.log("TEST 2 ERROR:", err2.message);
}
testFetch();
