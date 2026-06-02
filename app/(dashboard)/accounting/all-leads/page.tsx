'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Eye, Search, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import { formatCurrency } from '@/lib/currency'

type Lead = {
    id: string
    client_name: string
    phone: string
    email: string
    insurence_category: string
    policy_flow: string
    created_at: string
    total_premium: number
    expected_commission: number
    actual_commission: number
    accounting_status: string
    accounting_verified: boolean
    carrier: string
    current_stage: {
        stage_name: string
    } | null
    profiles: {
        full_name: string
    } | null
}

const STAGE_FILTERS = [
    { label: 'All Stages', value: null },
    { label: 'New Lead', value: 'New Lead' },
    { label: 'Quoting in Progress', value: 'Quoting in Progress' },
    { label: 'Quote has been Emailed', value: 'Quote Has Been Emailed' },
    { label: 'Consent Letter Sent', value: 'Consent Letter Sent' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Did not bind', value: 'Did Not Bind' },
]

export default function AccountingAllLeadsPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const stageFilter = searchParams.get('stage')
    
    // --- State Variables ---
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(0)

    // Filter states
    const [accountingStatusFilter, setAccountingStatusFilter] = useState<string>('all')
    const [accountingVerifiedFilter, setAccountingVerifiedFilter] = useState<string>('all')
    const [policyFlowFilter, setPolicyFlowFilter] = useState<string>('all')
    const [carrierFilter, setCarrierFilter] = useState<string>('all')

    // Dynamic lists for filter options
    const [availableCarriers, setAvailableCarriers] = useState<string[]>([])
    const [availableFlows, setAvailableFlows] = useState<string[]>([])

    // Load dynamic filter values once on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const { data } = await supabase
                    .from('temp_leads_basics')
                    .select('carrier, policy_flow')
                if (data) {
                    const carriers = Array.from(new Set(data.map(d => d.carrier).filter(Boolean))) as string[]
                    const flows = Array.from(new Set(data.map(d => d.policy_flow).filter(Boolean))) as string[]
                    setAvailableCarriers(carriers.sort())
                    setAvailableFlows(flows.sort())
                }
            } catch (err) {
                console.error('Failed to load filter options:', err)
            }
        }
        fetchFilters()
    }, [])

    // Load leads matching parameters
    useEffect(() => {
        const loadLeads = async () => {
            setLoading(true)

            let query = supabase
                .from('temp_leads_basics')
                .select(`
                  id,
                  client_name,
                  phone,
                  email,
                  insurence_category,
                  policy_flow,
                  created_at,
                  total_premium,
                  expected_commission,
                  actual_commission,
                  accounting_status,
                  accounting_verified,
                  carrier,
                  current_stage:pipeline_stages${stageFilter ? '!inner' : ''} (
                    stage_name
                  ),
                  profiles:profiles!fk_profile (
                    full_name
                  )
                `)
                .order('created_at', { ascending: false })
                .range(page * 10, (page + 1) * 10 - 1) // 10 items per page

            if (stageFilter) {
                if (stageFilter === 'Completed') {
                    query = query.in('current_stage.stage_name', [
                        'Completed',
                        'Completed (Same)',
                        'Completed (Switch)'
                    ])
                } else {
                    query = query.eq('current_stage.stage_name', stageFilter)
                }
            }

            if (accountingStatusFilter !== 'all') {
                if (accountingStatusFilter === 'unreconciled') {
                    query = query.or('accounting_status.eq.unreconciled,accounting_status.is.null')
                } else {
                    query = query.eq('accounting_status', accountingStatusFilter)
                }
            }

            if (accountingVerifiedFilter !== 'all') {
                query = query.eq('accounting_verified', accountingVerifiedFilter === 'verified')
            }

            if (policyFlowFilter !== 'all') {
                query = query.eq('policy_flow', policyFlowFilter)
            }

            if (carrierFilter !== 'all') {
                query = query.eq('carrier', carrierFilter)
            }

            const { data, error } = await query

            if (error) {
                console.error(error)
                setLeads([])
            } else {
                const formatted = (data as any[]).map(row => ({
                    ...row,
                    current_stage: Array.isArray(row.current_stage)
                        ? row.current_stage[0] ?? null
                        : row.current_stage ?? null,
                    profiles: Array.isArray(row.profiles)
                        ? row.profiles[0] ?? null
                        : row.profiles ?? null,
                }))

                setLeads(formatted)
            }

            setLoading(false)
        }

        loadLeads()
    }, [stageFilter, page, accountingStatusFilter, accountingVerifiedFilter, policyFlowFilter, carrierFilter])

    const applyFilter = (stage: string | null) => {
        setPage(0)
        if (!stage) {
            router.push('/accounting/all-leads')
        } else {
            router.push(`/accounting/all-leads?stage=${encodeURIComponent(stage)}`)
        }
    }

    const filteredLeads = leads.filter(lead => {
        const term = searchTerm.toLowerCase()
        return (
            (lead.client_name && lead.client_name.toLowerCase().includes(term)) ||
            (lead.email && lead.email.toLowerCase().includes(term)) ||
            (lead.phone && lead.phone.includes(term)) ||
            (lead.profiles && lead.profiles.full_name && lead.profiles.full_name.toLowerCase().includes(term)) ||
            (lead.carrier && lead.carrier.toLowerCase().includes(term))
        )
    })

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-[1400px] mx-auto w-full">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">All Accounting Leads</h1>
                        <p className="text-gray-600 mt-1 text-sm">View, filter, and audit policy premium totals and commission details.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Link href="/accounting" className="w-full sm:w-auto">
                            <button className="w-full px-5 py-2.5 bg-[#2E5C85] text-white rounded-lg hover:bg-[#2E5C85]/90 transition-all font-bold whitespace-nowrap shadow-sm text-sm">
                                Back to Dashboard
                            </button>
                        </Link>
                    </div>
                </div>

                {/* STAGE TABS */}
                <div className="flex gap-2 mb-5 flex-wrap">
                    {STAGE_FILTERS.map(filter => {
                        const isActive =
                            (!filter.value && !stageFilter) ||
                            filter.value === stageFilter

                        return (
                            <button
                                key={filter.label}
                                onClick={() => applyFilter(filter.value)}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors touch-manipulation
                                    ${isActive
                                        ? 'bg-[#2E5C85] text-white border-[#2E5C85] shadow-sm'
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
                    
                    {/* TOOLBAR WITH ADVANCED FILTERS */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search client, email, phone, carrier..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E5C85]/50 focus:border-[#2E5C85] text-sm transition-shadow font-medium text-gray-800 bg-white"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                                {filteredLeads.length} Lead{filteredLeads.length !== 1 && 's'} Found (This Page)
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100/60">
                            {/* Status Filter */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Accounting Status</label>
                                <select
                                    value={accountingStatusFilter}
                                    onChange={e => { setAccountingStatusFilter(e.target.value); setPage(0); }}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="reconciled">Reconciled</option>
                                    <option value="discrepancy">Discrepancy</option>
                                    <option value="unreconciled">Unreconciled</option>
                                    <option value="Pending Verification">Pending Verification</option>
                                </select>
                            </div>

                            {/* Verification Filter */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Verification</label>
                                <select
                                    value={accountingVerifiedFilter}
                                    onChange={e => { setAccountingVerifiedFilter(e.target.value); setPage(0); }}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none"
                                >
                                    <option value="all">All</option>
                                    <option value="verified">Verified</option>
                                    <option value="unverified">Unverified</option>
                                </select>
                            </div>

                            {/* Policy Flow Filter */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Policy Flow</label>
                                <select
                                    value={policyFlowFilter}
                                    onChange={e => { setPolicyFlowFilter(e.target.value); setPage(0); }}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none"
                                >
                                    <option value="all">All Flows</option>
                                    {availableFlows.map(flow => (
                                        <option key={flow} value={flow}>{flow}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Carrier Filter */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Carrier</label>
                                <select
                                    value={carrierFilter}
                                    onChange={e => { setCarrierFilter(e.target.value); setPage(0); }}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none"
                                >
                                    <option value="all">All Carriers</option>
                                    {availableCarriers.map(carrier => (
                                        <option key={carrier} value={carrier}>{carrier}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <Loading message="Loading accounting leads..." />
                    ) : filteredLeads.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-sm font-medium">
                            No accounting leads found matching your criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[1100px]">
                                <thead className="bg-gradient-to-r from-[#2E5C85] to-[#10B889] text-white uppercase text-[10px] font-extrabold border-b border-gray-100 tracking-widest">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-4 font-semibold rounded-tl-xl">Client Name</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Category / Flow</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Stage</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold text-right">Total Premium</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold text-right">Expected Comm</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold text-right">Actual Comm</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Status</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold text-center">Verification</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Created Date</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold text-center rounded-tr-xl">View</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {filteredLeads.map(lead => {
                                        const stage = lead.current_stage?.stage_name ?? '—'
                                        const createdDate = lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'

                                        return (
                                            <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-4 sm:px-6 py-4">
                                                    <p className="font-bold text-gray-900 whitespace-nowrap">{lead.client_name}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{lead.email}</p>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 capitalize text-gray-700 whitespace-nowrap">
                                                    <p className="font-semibold">{lead.insurence_category}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{lead.policy_flow}</p>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <StageBadge stage={stage} />
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-right">
                                                    <span className="font-bold text-gray-800">
                                                        {formatCurrency(lead.total_premium)}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-right">
                                                    <span className="font-bold text-emerald-600">
                                                        {formatCurrency(lead.expected_commission)}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-right">
                                                    <span className="font-bold text-purple-600">
                                                        {formatCurrency(lead.actual_commission)}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-gray-500 whitespace-nowrap text-sm font-medium">
                                                    <StatusBadge status={lead.accounting_status} />
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-center">
                                                    <VerificationBadge verified={lead.accounting_verified} />
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-gray-600 font-medium whitespace-nowrap">
                                                    {createdDate}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-center">
                                                    <Link
                                                        href={`/accounting/leads/${lead.id}`}
                                                        className="text-[#2E5C85] hover:text-[#E07A5F] transition-colors p-1.5 rounded-md hover:bg-gray-100 inline-flex items-center justify-center"
                                                        title="View Lead Accounting Console"
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

                    {/* PAGINATION CONTROLS */}
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-xs"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Page {page + 1}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={leads.length < 10 || loading}
                            className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-xs"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StageBadge({ stage }: { stage: string }) {
    const color =
        stage === 'Quoting in Progress'
            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            : stage === 'Quote Has Been Emailed'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : stage === 'Consent Letter Sent'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : stage === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : stage === 'Did Not Bind'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'

    return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap ${color}`}>
            {stage}
        </span>
    )
}

function StatusBadge({ status }: { status: string }) {
    const statusLower = status?.toLowerCase()
    
    let color = 'bg-gray-50 text-gray-600 border-gray-200'
    let icon = <Info size={12} />

    if (statusLower === 'reconciled') {
        color = 'bg-emerald-50 text-emerald-700 border-emerald-200'
        icon = <CheckCircle2 size={12} />
    } else if (statusLower === 'discrepancy') {
        color = 'bg-orange-50 text-orange-700 border-orange-200'
        icon = <AlertCircle size={12} />
    } else if (statusLower === 'unreconciled') {
        color = 'bg-blue-50 text-blue-700 border-blue-200'
        icon = <Info size={12} />
    } else if (statusLower === 'pending verification' || statusLower === 'pending_verification') {
        color = 'bg-yellow-50 text-yellow-700 border-yellow-200'
        icon = <AlertCircle size={12} />
    }

    return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border whitespace-nowrap flex items-center justify-center gap-1 w-fit ${color}`}>
            {icon}
            {status || 'Unreconciled'}
        </span>
    )
}

function VerificationBadge({ verified }: { verified: boolean }) {
    if (verified) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold rounded-md bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider">
                Verified
            </span>
        )
    } else {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold rounded-md bg-gray-50 text-gray-400 border border-gray-100 uppercase tracking-wider">
                Unverified
            </span>
        )
    }
}
