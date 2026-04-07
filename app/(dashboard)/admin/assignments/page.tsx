'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Filter, Users, GitBranch, RefreshCw, Briefcase, Activity } from 'lucide-react'
import { toast } from '@/lib/toast'

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

        const { data: csrData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'csr')

        const { data: pipeData } = await supabase.from('pipelines').select('id, name')
        const { data: stageData } = await supabase.from('pipeline_stages').select('id, stage_name, pipeline_id')

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
        console.log("Assigning CSR", newCsrId, "to lead", leadId)
        setUpdatingParams(prev => ({ ...prev, [leadId]: true }))

        const { data, error } = await supabase
            .from('temp_leads_basics')
            .update({ assigned_csr: newCsrId === 'unassigned' ? null : newCsrId })
            .eq('id', leadId)
            .select()

        console.log("Update Data Result:", data)
        if (error) {
            console.error("Update SQL Error:", error)
            toast('Failed to update assignment: ' + error.message, 'error')
        } else {
            console.log("Update successful, setting local state.")
            toast('Lead assignment updated successfully!', 'success')
            setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, assigned_csr: newCsrId === 'unassigned' ? null : newCsrId } : lead))
        }

        setUpdatingParams(prev => ({ ...prev, [leadId]: false }))
    }

    const getFilteredLeads = (isAssigned: boolean) => {
        return leads.filter(lead => {
            const meetsCondition = isAssigned ? lead.assigned_csr !== null : lead.assigned_csr === null
            if (!meetsCondition) return false

            if (filters.pipeline && lead.pipeline_id !== filters.pipeline) return false
            if (filters.stage && lead.current_stage_id !== filters.stage) return false
            if (filters.csr && lead.assigned_csr !== filters.csr) return false
            if (filters.policyType && lead.policy_type !== filters.policyType) return false

            return true
        })
    }

    const unassignedLeads = getFilteredLeads(false)
    const assignedLeads = getFilteredLeads(true)

    const getPipelineName = (id: string | null) => pipelines.find(p => p.id === id)?.name || 'Unknown'
    const getStageName = (id: string | null) => stages.find(s => s.id === id)?.stage_name || 'Unknown'

    const availableStages = filters.pipeline ? stages.filter(s => s.pipeline_id === filters.pipeline) : stages

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Lead Assignment Console</h1>
                    <p className="text-gray-500 mt-1 text-sm">Operational control panel for managing lead workloads.</p>
                </div>
                <Link href="/admin" className="w-full md:w-auto">
                    <button className="w-full md:w-auto px-5 py-2.5 bg-[#E07A5F] border border-gray-200 text-white rounded-lg hover:bg-[#E07A5F]/80 shadow-sm transition-all font-bold whitespace-nowrap">
                        Back to Dashboard
                    </button>
                </Link>
            </div>

            {/* Filter Hub */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Filter size={18} />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800">Console Filters</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline</label>
                        <select
                            value={filters.pipeline}
                            onChange={(e) => setFilters({ ...filters, pipeline: e.target.value, stage: '' })}
                            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full p-2.5 outline-none transition-all"
                        >
                            <option value="">All Pipelines</option>
                            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stage</label>
                        <select
                            value={filters.stage}
                            onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full p-2.5 outline-none transition-all"
                        >
                            <option value="">All Stages</option>
                            {availableStages.map(s => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CSR</label>
                        <select
                            value={filters.csr}
                            onChange={(e) => setFilters({ ...filters, csr: e.target.value })}
                            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full p-2.5 outline-none transition-all"
                        >
                            <option value="">All Assigned CSRs</option>
                            {csrs.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Policy Type</label>
                        <select
                            value={filters.policyType}
                            onChange={(e) => setFilters({ ...filters, policyType: e.target.value })}
                            className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full p-2.5 outline-none transition-all"
                        >
                            <option value="">All Policy Types</option>
                            <option value="auto">Auto</option>
                            <option value="home">Home</option>
                            <option value="commercial_auto">Comm. Auto</option>
                            <option value="gl">General Liability</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500 font-medium text-sm">Loading routing data...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* SECTION 1: Unassigned Leads */}
                    <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shadow-sm">
                                    <Activity size={18} />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-amber-900">Action Required: Unassigned Leads</h2>
                            </div>
                            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-amber-200 whitespace-nowrap">
                                {unassignedLeads.length} Lead{unassignedLeads.length !== 1 && 's'} Found
                            </span>
                        </div>

                        {unassignedLeads.length === 0 ? (
                            <div className="p-10 text-center text-gray-500 text-sm">
                                <p>All matched leads are currently assigned.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                                            <th className="p-3 sm:p-4 font-bold">Client Name</th>
                                            <th className="p-3 sm:p-4 font-bold">Policy Type</th>
                                            <th className="p-3 sm:p-4 font-bold">Pipeline Region</th>
                                            <th className="p-3 sm:p-4 font-bold">Current Stage</th>
                                            <th className="p-3 sm:p-4 font-bold">Date Received</th>
                                            <th className="p-3 sm:p-4 font-bold text-right">Assign CSR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {unassignedLeads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-amber-50/30 transition-colors">
                                                <td className="p-3 sm:p-4 text-gray-900 font-bold text-sm whitespace-nowrap">{lead.client_name}</td>
                                                <td className="p-3 sm:p-4 text-gray-600 text-xs capitalize">{lead.policy_type}</td>
                                                <td className="p-3 sm:p-4 text-gray-600 text-xs">{getPipelineName(lead.pipeline_id)}</td>
                                                <td className="p-3 sm:p-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200 whitespace-nowrap">
                                                        {getStageName(lead.current_stage_id)}
                                                    </span>
                                                </td>
                                                <td className="p-3 sm:p-4 text-gray-500 text-xs font-mono">{new Date(lead.created_at).toLocaleDateString()}</td>
                                                <td className="p-3 sm:p-4 text-right">
                                                    <select
                                                        className={`border rounded-lg text-xs p-2 outline-none cursor-pointer transition-all shadow-sm min-w-[130px]
                                                            ${updatingParams[lead.id] ? 'bg-gray-100 text-gray-400' : 'bg-white border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-900 font-bold'}
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
                        <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shadow-sm">
                                    <Users size={18} />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Active Assigned Leads</h2>
                            </div>
                            <span className="bg-white border border-gray-200 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
                                {assignedLeads.length} Lead{assignedLeads.length !== 1 && 's'} Found
                            </span>
                        </div>

                        {assignedLeads.length === 0 ? (
                            <div className="p-10 text-center text-gray-500 text-sm">
                                <p>No assigned leads match your current filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs border-b border-gray-100 tracking-wider">
                                            <th className="p-3 sm:p-4 font-bold">Client Name</th>
                                            <th className="p-3 sm:p-4 font-bold">Policy Type</th>
                                            <th className="p-3 sm:p-4 font-bold">Pipeline Region</th>
                                            <th className="p-3 sm:p-4 font-bold">Current Stage</th>
                                            <th className="p-3 sm:p-4 font-bold">Assigned CSR</th>
                                            <th className="p-3 sm:p-4 font-bold text-right">Reassign</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assignedLeads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-blue-50/20 transition-colors group">
                                                <td className="p-3 sm:p-4 text-gray-900 font-bold text-sm whitespace-nowrap">{lead.client_name}</td>
                                                <td className="p-3 sm:p-4 text-gray-600 text-xs capitalize">{lead.policy_type}</td>
                                                <td className="p-3 sm:p-4 text-gray-600 text-xs">{getPipelineName(lead.pipeline_id)}</td>
                                                <td className="p-3 sm:p-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200 whitespace-nowrap">
                                                        {getStageName(lead.current_stage_id)}
                                                    </span>
                                                </td>
                                                <td className="p-3 sm:p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-emerald-50 flex-shrink-0">
                                                            {csrs.find(c => c.id === lead.assigned_csr)?.full_name?.[0] || 'U'}
                                                        </div>
                                                        <span className="font-bold text-gray-700 text-xs whitespace-nowrap">
                                                            {csrs.find(c => c.id === lead.assigned_csr)?.full_name || 'Unknown CSR'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 sm:p-4 text-right">
                                                    <select
                                                        className={`border rounded-lg text-[10px] p-2 outline-none cursor-pointer transition-all min-w-[130px]
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
