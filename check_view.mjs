import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkView() {
    const { data, error } = await supabase.rpc('get_tables_and_views');
    console.log(data || error);
}
// wait, `get_tables_and_views` might not exist.
checkView();
