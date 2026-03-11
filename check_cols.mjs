import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data, error } = await supabase
        .from('temp_leads_basics')
        .select('*')
        .limit(1);

    if (error) console.error("ERROR:", error);
    if (data) console.log("KEYS:", Object.keys(data[0] || {}));
}
testFetch();
