import StagesClient from './StagesClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
            <Link href="/superadmin/pipelines">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white   border border-gray-200  rounded-xl font-semibold transition-all shadow-sm group w-fit mb-6">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Pipelines
                </button>
            </Link>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">Stage Editor: {pipeline?.name || 'Loading...'}</h1>
            <p className="text-gray-600 mb-8">Manage the sequence and configuration of stages for this workflow.</p>

            <StagesClient pipelineId={params.id} />
        </div>
    )
}
