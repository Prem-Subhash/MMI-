import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data: stages, error } = await supabase
        .from('pipeline_stages')
        .select(`stage_name, mandatory_fields, pipelines(name)`);

    fs.writeFileSync('test_db_output.json', JSON.stringify(stages, null, 2), 'utf8');
}
testFetch();
