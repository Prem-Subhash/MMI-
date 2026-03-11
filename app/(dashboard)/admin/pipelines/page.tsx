import { supabaseServer as supabase } from '@/lib/supabaseServer'
import Link from 'next/link'
import PipelineClient from './PipelineClient'

export default async function AdminPipelinesPage() {

    // 1. Fetch Pipelines
    const { data: pipelines } = await supabase
        .from('pipelines')
        .select('id, name')
        .order('id', { ascending: true })

    // 2. Fetch Stages
    const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id, pipeline_id, stage_name, stage_order')
        .order('stage_order', { ascending: true })

    // 3. Fetch all Admin leads fields directly on server to bypass RLS limits
    const { data: leads, error: leadsError } = await supabase
        .from('temp_leads_basics')
        .select(`
            id,
            client_name,
            phone,
            email,
            insurence_category,
            policy_flow,
            pipeline_id,
            current_stage_id,
            created_at,
            assigned_csr,
            current_stage:pipeline_stages (
                stage_name
            ),
            csrs (
              name
            )
        `)
        .order('created_at', { ascending: false })

    if (leadsError) {
        console.error("FATAL: Error fetching temp_leads_basics:", leadsError)
    }

    // Count leads per stage
    const stageCounts: Record<string, number> = {}
    if (leads) {
        leads.forEach((lead: any) => {
            if (lead.current_stage_id) {
                stageCounts[lead.current_stage_id] = (stageCounts[lead.current_stage_id] || 0) + 1
            }
        })
    }

    console.log("PIPELINES FETCHED:", pipelines?.length)
    console.log("LEADS FETCHED:", leads?.length)
    if (leads && leads.length > 0) {
        console.log("FIRST LEAD PIPELINE ID:", leads[0].pipeline_id)
        console.log("FIRST PIPELINE ID:", pipelines?.[0]?.id)
    }

    // Define the specific display order requested
    const targetPipelines = [
        'Personal Lines Pipeline',
        'Personal Lines Renewal Pipeline',
        'Commercial Lines Pipeline',
        'Commercial Lines Renewal Pipeline'
    ]

    return (
        <PipelineClient
            pipelines={pipelines}
            stages={stages}
            stageCounts={stageCounts}
            targetPipelines={targetPipelines}
            initialLeads={leads || []}
        />
    )
}
