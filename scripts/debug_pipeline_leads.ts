import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLeads() {
    console.log('--- DEBUGGING LEADS ---')
    const { data, error } = await supabase
        .from('temp_leads_basics')
        .select('id, client_name, policy_flow, insurence_category, pipeline_id, current_stage_id, assigned_csr')

    if (error) {
        console.error('Error fetching leads:', error)
        return
    }

    console.log(`Found ${data.length} total leads.`)
    if (data.length > 0) {
        console.table(data)
    }

    const { data: pipelines } = await supabase.from('pipelines').select('*')
    console.log('\n--- PIPELINES ---')
    console.table(pipelines)

    const { data: pipeline_stages } = await supabase.from('pipeline_stages').select('id, pipeline_id, stage_name, stage_order')
    console.log('\n--- STAGES ---')
    console.table(pipeline_stages)
}

debugLeads()
