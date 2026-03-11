import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpTable(tableName) {
    const { data } = await supabase.from(tableName).select('*').limit(1);
    if (data && data.length > 0) {
        return Object.keys(data[0]);
    }
    return [];
}

async function run() {
    const tables = [
        'profiles', 'temp_intake_forms', 'clients', 'temp_leads_basics',
        'pipeline_stages', 'email_templates', 'pipelines', 'client_insurance_details',
        'email_logs', 'uploaded_documents', 'form_templates', 'csrs'
    ];

    const schema = {};
    for (const t of tables) {
        schema[t] = await dumpTable(t);
    }
    fs.writeFileSync('inferred_schema.json', JSON.stringify(schema, null, 2));
    console.log("Schema inferred");
}
run();
