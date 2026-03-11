import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    const { data, error } = await supabase.rpc('get_raw_page', {
        query: `
        select relname, relrowsecurity from pg_class where relname = 'temp_leads_basics';
        ` });
    console.log(data || "no rpc");
}
// since rpc might not exist, I can just query the pg_class via another way,
// but wait, I can just write a pg query if I have postgres connection string. I don't.
