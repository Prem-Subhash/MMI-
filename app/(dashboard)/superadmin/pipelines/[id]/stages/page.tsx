import StagesClient from './StagesClient'
import { createServer } from '@/lib/supabaseServer'

export default async function PipelineStagesPage({ params }: { params: { id: string } }) {
    const supabase = await createServer()

    // Fetch pipeline name for context
    const { data: pipeline } = await supabase
        .from('pipelines')
        .select('name')
        .eq('id', params.id)
        .single()

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Stage Editor: {pipeline?.name || 'Loading...'}</h1>
            <p className="text-gray-600 mb-8">Manage the sequence and configuration of stages for this workflow.</p>

            <StagesClient pipelineId={params.id} />
        </div>
    )
}
