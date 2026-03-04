import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'

export default async function AdminPipelinesPage() {
    const supabase = await createServer()

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

    // 3. Fetch Leads to count them
    const { data: leads } = await supabase
        .from('temp_leads_basics')
        .select('current_stage_id')

    // Count leads per stage
    const stageCounts: Record<string, number> = {}
    if (leads) {
        leads.forEach((lead: any) => {
            if (lead.current_stage_id) {
                stageCounts[lead.current_stage_id] = (stageCounts[lead.current_stage_id] || 0) + 1
            }
        })
    }

    // Define the specific display order requested
    const targetPipelines = [
        'Personal Lines Pipeline',
        'Personal Lines Renewal Pipeline',
        'Commercial Lines Pipeline',
        'Commercial Lines Renewal Pipeline'
    ]

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Pipeline Monitoring</h1>
                    <p className="text-gray-600">Overview of pipeline stages and current lead distribution separated by pipeline.</p>
                </div>
                <Link href="/admin">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                        Back
                    </button>
                </Link>
            </div>

            <div className="flex flex-col gap-12">
                {targetPipelines.map((targetName) => {
                    const p = pipelines?.find((pipe: any) => pipe.name === targetName)

                    if (!p) return null // If the database is missing this pipeline, skip gracefully

                    const pStages = stages?.filter((s: any) => s.pipeline_id === p.id) || []

                    return (
                        <div key={p.id}>
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{p.name}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {pStages.length > 0 ? pStages.map((stage: any) => {
                                    const count = stageCounts[stage.id] || 0

                                    return (
                                        <div key={stage.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between h-32 hover:border-emerald-400 transition">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider line-clamp-2">
                                                    {stage.stage_name}
                                                </h3>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <span className="text-3xl font-bold text-gray-800">{count}</span>
                                                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded">
                                                    Stage {stage.stage_order}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <p className="text-gray-400 text-sm">No stages mapped to this pipeline yet.</p>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Fallback for any unmatched pipelines in the database */}
                {pipelines?.filter((p: any) => !targetPipelines.includes(p.name)).map((p: any) => {
                    const pStages = stages?.filter((s: any) => s.pipeline_id === p.id) || []
                    if (pStages.length === 0) return null

                    return (
                        <div key={p.id} className="opacity-75">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{p.name} (Other)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {pStages.map((stage: any) => {
                                    const count = stageCounts[stage.id] || 0
                                    return (
                                        <div key={stage.id} className="bg-gray-50 rounded-xl shadow-sm border p-6 flex flex-col justify-between h-32">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider line-clamp-2">
                                                    {stage.stage_name}
                                                </h3>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <span className="text-3xl font-bold text-gray-800">{count}</span>
                                                <span className="text-xs text-gray-400 font-medium bg-gray-200 px-2 py-1 rounded">
                                                    Stage {stage.stage_order}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
