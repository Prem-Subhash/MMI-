'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Filter, Users, GitBranch, RefreshCw, Briefcase, Activity } from 'lucide-react'

// Types
type Lead = {
    id: string
    client_name: string
    policy_type: string
    assigned_csr: string | null
    pipeline_id: string | null
    current_stage_id: string | null
    created_at: string
}

type CSR = { id: string, full_name: string }
type Pipeline = { id: string, name: string }
type Stage = { id: string, stage_name: string, pipeline_id: string }

export default function AdminAssignmentsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [csrs, setCsrs] = useState<CSR[]>([])
    const [pipelines, setPipelines] = useState<Pipeline[]>([])
    const [stages, setStages] = useState<Stage[]>([])

    const [loading, setLoading] = useState(true)
    const [updatingParams, setUpdatingParams] = useState<Record<string, boolean>>({})

    // Filters
    const [filters, setFilters] = useState({
        pipeline: '',
        stage: '',
        csr: '',
        policyType: ''
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)

        // 1. Fetch CSRs
        const { data: csrData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'csr')

        // 2. Fetch Pipelines & Stages
        const { data: pipeData } = await supabase.from('pipelines').select('id, name')
        const { data: stageData } = await supabase.from('pipeline_stages').select('id, stage_name, pipeline_id')

        // 3. Fetch Leads
        const { data: leadData } = await supabase
            .from('temp_leads_basics')
            .select(`
                id,
                client_name,
                policy_type,
                assigned_csr,
                pipeline_id,
                current_stage_id,
                created_at
            `)
            .order('created_at', { ascending: false })

        if (csrData) setCsrs(csrData)
        if (pipeData) setPipelines(pipeData)
        if (stageData) setStages(stageData)
        if (leadData) setLeads(leadData)

        setLoading(false)
    }

    const handleAssignCSR = async (leadId: string, newCsrId: string) => {
        setUpdatingParams(prev => ({ ...prev, [leadId]: true }))

        const { error } = await supabase
            .from('temp_leads_basics')
            .update({ assigned_csr: newCsrId === 'unassigned' ? null : newCsrId })
            .eq('id', leadId)

        if (!error) {
            // Update local state instantly
            setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, assigned_csr: newCsrId === 'unassigned' ? null : newCsrId } : lead))
        } else {
            alert('Failed to update assignment: ' + error.message)
        }

        setUpdatingParams(prev => ({ ...prev, [leadId]: false }))
    }

    // Client-side filtering
    const getFilteredLeads = (isAssigned: boolean) => {
        return leads.filter(lead => {
            // First check assignment condition
            const meetsCondition = isAssigned ? lead.assigned_csr !== null : lead.assigned_csr === null
            if (!meetsCondition) return false

            // Then apply dropdown filters
            if (filters.pipeline && lead.pipeline_id !== filters.pipeline) return false
            if (filters.stage && lead.current_stage_id !== filters.stage) return false
            if (filters.csr && lead.assigned_csr !== filters.csr) return false
            if (filters.policyType && lead.policy_type !== filters.policyType) return false

            return true
        })
    }

    const unassignedLeads = getFilteredLeads(false)
    const assignedLeads = getFilteredLeads(true)

    // Helper functions for lookups
    const getPipelineName = (id: string | null) => pipelines.find(p => p.id === id)?.name || 'Unknown'
    const getStageName = (id: string | null) => stages.find(s => s.id === id)?.stage_name || 'Unknown'

    // Auto-filter dynamic stages dropdown
    const availableStages = filters.pipeline ? stages.filter(s => s.pipeline_id === filters.pipeline) : stages

    return (
        <div className="p-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Lead Assignment Console</h1>
                    <p className="text-gray-500 mt-1">Operational control panel for managing and distributing lead workloads.</p>
                </div>
                <Link href="/admin">
                    <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition font-medium">
                        Back to Dashboard
                    </button>
                </Link>
            </div>

            {/* Filter Hub */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="text-blue-600" size={20} />
                    <h2 className="text-lg font-semibold text-gray-800">Console Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                        value={filters.pipeline}
                        onChange={(e) => setFilters({ ...filters, pipeline: e.target.value, stage: '' })} // Reset stage when pipeline changes
                        className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                    >
                        <option value="">All Pipelines</option>
                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <select
                        value={filters.stage}
                        onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                        className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                    >
                        <option value="">All Stages</option>
                        {availableStages.map(s => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
                    </select>

                    <select
                        value={filters.csr}
                        onChange={(e) => setFilters({ ...filters, csr: e.target.value })}
                        className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                    >
                        <option value="">All Assigned CSRs</option>
                        {csrs.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>

                    <select
                        value={filters.policyType}
                        onChange={(e) => setFilters({ ...filters, policyType: e.target.value })}
                        className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                    >
                        <option value="">All Policy Types</option>
                        <option value="auto">Auto</option>
                        <option value="home">Home</option>
                        <option value="commercial_auto">Comm. Auto</option>
                        <option value="gl">General Liability</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent flex rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500 font-medium">Loading routing data...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {/* SECTION 1: Unassigned Leads */}
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden relative">
                        {/* Distinctive Header */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shadow-sm">
                                    <Activity size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-amber-900">Action Required: Unassigned Leads</h2>
                            </div>
                            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                                {unassignedLeads.length} Lead{unassignedLeads.length !== 1 && 's'} Found
                            </span>
                        </div>

                        {unassignedLeads.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <p>All matched leads are currently assigned.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                            <th className="p-4 font-semibold">Client Name</th>
                                            <th className="p-4 font-semibold">Policy Type</th>
                                            <th className="p-4 font-semibold">Pipeline Region</th>
                                            <th className="p-4 font-semibold">Current Stage</th>
                                            <th className="p-4 font-semibold">Date Received</th>
                                            <th className="p-4 font-semibold text-right">Assign CSR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {unassignedLeads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-amber-50/30 transition">
                                                <td className="p-4 text-gray-900 font-medium">{lead.client_name}</td>
                                                <td className="p-4 text-gray-600 text-sm capitalize">{lead.policy_type}</td>
                                                <td className="p-4 text-gray-600 text-sm">{getPipelineName(lead.pipeline_id)}</td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {getStageName(lead.current_stage_id)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 text-sm">{new Date(lead.created_at).toLocaleDateString()}</td>
                                                <td className="p-4 text-right">
                                                    <select
                                                        className={`border rounded-lg text-sm p-2 outline-none cursor-pointer transition-colors shadow-sm
                                                            ${updatingParams[lead.id] ? 'bg-gray-100 text-gray-400' : 'bg-white border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 font-medium'}
                                                        `}
                                                        defaultValue=""
                                                        disabled={updatingParams[lead.id]}
                                                        onChange={(e) => handleAssignCSR(lead.id, e.target.value)}
                                                    >
                                                        <option value="" disabled>Select CSR...</option>
                                                        {csrs.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: Assigned Leads */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 p-5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shadow-sm">
                                    <Users size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Active Assigned Leads</h2>
                            </div>
                            <span className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                                {assignedLeads.length} Lead{assignedLeads.length !== 1 && 's'} Found
                            </span>
                        </div>

                        {assignedLeads.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <p>No assigned leads match your current filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                            <th className="p-4 font-semibold">Client Name</th>
                                            <th className="p-4 font-semibold">Policy Type</th>
                                            <th className="p-4 font-semibold">Pipeline Region</th>
                                            <th className="p-4 font-semibold">Current Stage</th>
                                            <th className="p-4 font-semibold">Assigned CSR</th>
                                            <th className="p-4 font-semibold text-right">Reassign</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assignedLeads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-blue-50/20 transition group">
                                                <td className="p-4 text-gray-900 font-medium">{lead.client_name}</td>
                                                <td className="p-4 text-gray-600 text-sm capitalize">{lead.policy_type}</td>
                                                <td className="p-4 text-gray-600 text-sm">{getPipelineName(lead.pipeline_id)}</td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {getStageName(lead.current_stage_id)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                                            {csrs.find(c => c.id === lead.assigned_csr)?.full_name?.[0] || 'U'}
                                                        </div>
                                                        <span className="font-semibold text-gray-700 text-sm">
                                                            {csrs.find(c => c.id === lead.assigned_csr)?.full_name || 'Unknown CSR'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <select
                                                        className={`border rounded-lg text-sm p-2 outline-none cursor-pointer transition-colors
                                                            ${updatingParams[lead.id] ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 group-hover:bg-white'}
                                                        `}
                                                        value={lead.assigned_csr || ""}
                                                        disabled={updatingParams[lead.id]}
                                                        onChange={(e) => handleAssignCSR(lead.id, e.target.value)}
                                                    >
                                                        <option value="unassigned">-- Unassign Lead --</option>
                                                        {csrs.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
