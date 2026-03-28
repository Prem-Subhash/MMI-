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
    profiles: {
        full_name: string
    } | null
}

export default function PipelineClient({
    pipelines,
    stages,
    stageCounts,
    targetPipelines,
    initialLeads
}: any) {

    // Arrange pipelines
    const validTargetPipelines = targetPipelines
        .map((name: string) => pipelines?.find((p: any) => p.name === name))
        .filter(Boolean)

    const otherPipelines =
        pipelines?.filter((p: any) => !targetPipelines.includes(p.name)) || []

    const displayPipelines = [...validTargetPipelines, ...otherPipelines]

    // State
    const [selectedPipeline, setSelectedPipeline] = useState(displayPipelines[0]?.id || '')
    const [stageFilter, setStageFilter] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const currentPipeline = displayPipelines.find((p: any) => p.id === selectedPipeline)
    const currentStages = stages?.filter((s: any) => s.pipeline_id === selectedPipeline) || []

    // Reset stage filter
    useEffect(() => {
        setStageFilter(null)
    }, [selectedPipeline])

    // 🔥 FILTER LEADS FROM SERVER DATA
    const pipelineLeads = (initialLeads || []).filter(
        (lead: any) => lead.pipeline_id === selectedPipeline
    )

    const stagedLeads = stageFilter
        ? pipelineLeads.filter(
            (lead: any) => lead.current_stage?.stage_name === stageFilter
        )
        : pipelineLeads

    const filteredLeads = stagedLeads.filter((lead: any) => {
        const term = searchTerm.toLowerCase()
        return (
            lead.client_name?.toLowerCase().includes(term) ||
            lead.email?.toLowerCase().includes(term) ||
            lead.phone?.includes(term) ||
            lead.profiles?.full_name?.toLowerCase().includes(term)
        )
    })

    return (
        <div className="p-8 max-w-7xl mx-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Pipeline Monitoring</h1>
                    <p className="text-gray-600">
                        Overview of pipeline stages and leads.
                    </p>
                </div>
                <Link href="/admin">
                    <button className="px-4 py-2 bg-gray-100 rounded-lg">
                        Back
                    </button>
                </Link>
            </div>

            {/* PIPELINES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {displayPipelines.map((p: any) => {
                    const pStages = stages?.filter((s: any) => s.pipeline_id === p.id) || []
                    const totalLeads = pStages.reduce(
                        (sum: number, stage: any) => sum + (stageCounts[stage.id] || 0),
                        0
                    )

                    return (
                        <div
                            key={p.id}
                            onClick={() => setSelectedPipeline(p.id)}
                            className="cursor-pointer bg-white p-6 rounded-xl border hover:shadow"
                        >
                            <h3 className="font-bold">{p.name}</h3>
                            <p>Total Leads: {totalLeads}</p>
                        </div>
                    )
                })}
            </div>

            {/* FILTERS */}
            {currentPipeline && (
                <>
                    <div className="flex gap-3 mb-6 flex-wrap">
                        {[{ label: 'All', value: null },
                        ...currentStages.map((s: any) => ({
                            label: s.stage_name,
                            value: s.stage_name
                        }))].map((filter: any) => (
                            <button
                                key={filter.label}
                                onClick={() => setStageFilter(filter.value)}
                                className="px-4 py-2 border rounded-full"
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* SEARCH */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="border p-2 w-full max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* TABLE */}
                    {filteredLeads.length === 0 ? (
                        <p>No leads found</p>
                    ) : (
                        <table className="w-full border">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Stage</th>
                                    <th>CSR</th>
                                    <th>View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead: Lead) => (
                                    <tr key={lead.id}>
                                        <td>{lead.client_name}</td>
                                        <td>{lead.phone}</td>
                                        <td>{lead.email}</td>
                                        <td>{lead.current_stage?.stage_name}</td>
                                        <td>
                                            {lead.profiles?.full_name || 'Unassigned'}
                                        </td>
                                        <td>
                                            <Link href={`/csr/leads/${lead.id}`}>
                                                <Eye size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    )
}