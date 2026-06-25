import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testQuery() {
    const { data, error } = await supabase
        .from('temp_leads_basics')
        .select(`
            id,
            client_name,
            csrs!temp_leads_basics_assigned_csr_fkey (
                name
            )
        `)
        .limit(1);

    if (error) console.error("Error:", error);
    else {
        console.log("Returned Payload:");
        console.log(JSON.stringify(data, null, 2));
    }
}

testQuery();
