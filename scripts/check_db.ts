import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_column_info', {
        p_table_name: 'temp_leads_basics',
        p_column_name: 'assigned_csr'
    })

    if (error) {
        console.log("Could not use RPC, trying direct insert test...")
        // Let's just do a dry run insert with NULL to see if it bounces
        const { data: insertData, error: insertError } = await supabase
            .from('temp_leads_basics')
            .insert({
                client_name: 'Test Null Assignment',
                insurence_category: 'personal',
                policy_coverage: 'auto',
                assigned_csr: null
            })
            .select()

        console.log("Insert Result:", { insertData, insertError })
    } else {
        console.log("Column Info:", data)
    }
}

checkSchema()
