import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpCols() {
    const { data, error } = await supabase
        .from('temp_leads_basics')
        .select('*')
        .limit(1);

    if (error) console.error("ERROR:", error);
    fs.writeFileSync('all_cols.json', JSON.stringify(Object.keys(data[0] || {}), null, 2));
}
dumpCols();
