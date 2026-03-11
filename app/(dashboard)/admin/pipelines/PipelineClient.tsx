'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, Search } from 'lucide-react'

/* ================= TYPES ================= */

type Lead = {
    id: string
    client_name: string
    phone: string
    email: string
    insurence_category: string
    policy_flow: string
    pipeline_id: string
    current_stage_id: string
    created_at: string
    current_stage: {
        stage_name: string
    } | null
    csrs: {
        name: string
    } | null
}

export default function PipelineClient({ pipelines, stages, stageCounts, targetPipelines, initialLeads }: any) {
    // 1. Organize pipelines according to requested target order
    const validTargetPipelines = targetPipelines
        .map((name: string) => pipelines?.find((p: any) => p.name === name))
        .filter(Boolean)

    const otherPipelines = pipelines?.filter((p: any) => !targetPipelines.includes(p.name)) || []
    const displayPipelines = [...validTargetPipelines, ...otherPipelines]

    // 2. State & Selections
    const [selectedPipeline, setSelectedPipeline] = useState(displayPipelines[0]?.id || '')
    const [stageFilter, setStageFilter] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const currentPipeline = displayPipelines.find((p: any) => p.id === selectedPipeline)
    const currentStages = stages?.filter((s: any) => s.pipeline_id === selectedPipeline) || []

    // 3. Reset stage filter when pipeline changes
    useEffect(() => {
        setStageFilter(null)
    }, [selectedPipeline])

    // Debugging logs requested by user
    console.log("INITIAL LEADS RECEIVED:", initialLeads?.length || 0)
    console.log("SELECTED PIPELINE:", selectedPipeline)

    // 4. In-Memory Filter (Replaces Client-Side Supabase Query)
    const pipelineLeads = (initialLeads || []).filter((lead: any) => lead.pipeline_id === selectedPipeline)

    // Normalize relationship objects for consistency
    const normalizedLeads = pipelineLeads.map((row: any) => ({
        ...row,
        current_stage: row.current_stage ?? null,
        csrs: row.csrs ?? null,
    }))

    const stagedLeads = stageFilter
        ? normalizedLeads.filter((lead: any) => lead.current_stage?.stage_name === stageFilter)
        : normalizedLeads;

    // 5. Client-Side Search
    const filteredLeads = stagedLeads.filter((lead: any) => {
        const term = searchTerm.toLowerCase()
        return (
            (lead.client_name && lead.client_name.toLowerCase().includes(term)) ||
            (lead.email && lead.email.toLowerCase().includes(term)) ||
            (lead.phone && lead.phone.includes(term)) ||
            ((lead.csrs?.name) && (lead.csrs?.name).toLowerCase().includes(term))
        )
    })

    /* ================= UI ================= */

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Pipeline Monitoring</h1>
                    <p className="text-gray-600">Overview of pipeline stages and current lead distribution separated by pipeline.</p>
                </div>
                <Link href="/admin">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                        Back to Dashboard
                    </button>
                </Link>
            </div>

            {/* STEP 1: Pipeline Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {displayPipelines.map((p: any) => {
                    const pStages = stages?.filter((s: any) => s.pipeline_id === p.id) || []
                    const totalLeads = pStages.reduce((sum: number, stage: any) => sum + (stageCounts[stage.id] || 0), 0)
                    const isSelected = selectedPipeline === p.id

                    return (
                        <div
                            key={p.id}
                            onClick={() => setSelectedPipeline(p.id)}
                            className={`cursor-pointer rounded-xl p-6 flex flex-col justify-between transition shadow-sm border
                                ${isSelected
                                    ? 'border-brand bg-[#10B889]/5 ring-1 ring-brand shadow-md transform scale-[1.02]'
                                    : 'bg-white hover:border-brand/40 hover:shadow-md'
                                }`}
                        >
                            <h3 className={`text-lg font-bold line-clamp-2 ${isSelected ? 'text-brand-dark' : 'text-gray-800'}`}>
                                {p.name}
                            </h3>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Total Leads</span>
                                <span className={`text-xl font-bold ${isSelected ? 'text-brand-dark' : 'text-gray-700'}`}>
                                    {totalLeads}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* STEP 2: Selected Pipeline Dashboard (Stage Tabs & Table) */}
            {currentPipeline && (
                <div className="mt-8">
                    {/* FILTER TABS */}
                    <div className="flex gap-3 mb-6 flex-wrap">
                        {[{ label: 'All', value: null }, ...currentStages.map((s: any) => ({ label: s.stage_name, value: s.stage_name }))].map((filter: any) => {
                            const isActive = filter.value === stageFilter

                            return (
                                <button
                                    key={filter.label}
                                    onClick={() => setStageFilter(filter.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
                                        ${isActive
                                            ? 'bg-brand text-white border-brand shadow-sm'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                        }
                                    `}
                                >
                                    {filter.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* TABLE SECTION */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {/* TOOLBAR */}
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="relative max-w-sm w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search client, email, phone, or CSR..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-shadow"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                                {filteredLeads.length} Lead{filteredLeads.length !== 1 && 's'} Found
                            </div>
                        </div>

                        {filteredLeads.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                No leads found in this stage.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs border-b border-gray-100 tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Client Name</th>
                                            <th className="px-6 py-4 font-semibold">Phone</th>
                                            <th className="px-6 py-4 font-semibold">Email</th>
                                            <th className="px-6 py-4 font-semibold">Category</th>
                                            <th className="px-6 py-4 font-semibold">Flow</th>
                                            <th className="px-6 py-4 font-semibold">Stage</th>
                                            <th className="px-6 py-4 font-semibold">Assigned CSR</th>
                                            <th className="px-6 py-4 font-semibold">Created</th>
                                            <th className="px-6 py-4 font-semibold text-center">View</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {filteredLeads.map(lead => {
                                            const stage = lead.current_stage?.stage_name ?? '—'

                                            return (
                                                <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{lead.client_name}</td>
                                                    <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                                                    <td className="px-6 py-4 text-gray-600">{lead.email}</td>
                                                    <td className="px-6 py-4 capitalize text-gray-700">{lead.insurence_category}</td>
                                                    <td className="px-6 py-4 capitalize text-gray-700">{lead.policy_flow}</td>
                                                    <td className="px-6 py-4">
                                                        <StageBadge stage={stage} />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {lead.csrs?.name ? (
                                                            <span className="font-semibold text-gray-700 text-sm">
                                                                {lead.csrs.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-600 font-semibold text-sm">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {new Date(lead.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Link
                                                            href={`/csr/leads/${lead.id}`}
                                                            className="text-brand-dark hover:text-[#B55D44] transition-colors p-1 rounded-md hover:bg-gray-100 inline-flex items-center justify-center"
                                                            title="View Lead Details"
                                                        >
                                                            <Eye size={18} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!currentPipeline && displayPipelines.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    No pipelines available in the system.
                </div>
            )}
        </div>
    )
}

/* ================= STAGE BADGE ================= */

function StageBadge({ stage }: { stage: string }) {
    const color =
        stage === 'Quoting in Progress'
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            : stage === 'Quote Has Been Emailed' || stage === 'Quote has been emailed'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : stage === 'Consent Letter Sent'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : stage === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : stage === 'Did Not Bind'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {stage}
        </span>
    )
}
