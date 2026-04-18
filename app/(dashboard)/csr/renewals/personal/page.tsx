'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Calendar, Download, Search } from 'lucide-react'
import Loading from '@/components/ui/Loading'

type Renewal = {
    id: string
    client_name: string
    policy_type: string
    renewal_date: string
    carrier?: string
    current_premium?: number
    renewal_premium?: number
    assigned_csr?: string
    policy_number?: string
    referral?: string
    notes?: string
    business_name?: string
    pipeline_stage: {
        stage_name: string
    } | null
}

export default function PersonalRenewalPage() {
    return (
        <Suspense fallback={<Loading message="Loading renewals..." />}>
            <PersonalRenewalContent />
        </Suspense>
    )
}

function PersonalRenewalContent() {
    const [renewals, setRenewals] = useState<Renewal[]>([])
    const [loading, setLoading] = useState(true)
    const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7))
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(0)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    useEffect(() => {
        setPage(0)
    }, [monthFilter])

    const load = async () => {
        setLoading(true)
        setErrorMsg(null)
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        let query = supabase
            .from('temp_leads_basics')
            .select(`
      id,
      client_name,
      policy_type,
      renewal_date,
      carrier,
      current_premium,
      renewal_premium,
      assigned_csr,
      policy_number,
      referral,
      notes,
      insurence_category,
      business_name,
      pipeline_stage:pipeline_stages (
        stage_name,
        pipeline_id
      )
    `)
            .eq('policy_flow', 'renewal')
            .eq('insurence_category', 'personal')
            .eq('assigned_csr', user.id)
            .order('renewal_date', { ascending: true })
            .range(page * 10, (page + 1) * 10 - 1)

        if (monthFilter) {
            const startOfMonth = `${monthFilter}-01`
            const [year, month] = monthFilter.split('-')
            const nextMonth = month === '12' ? 1 : parseInt(month) + 1
            const nextYear = month === '12' ? parseInt(year) + 1 : parseInt(year)
            const nextDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

            query = query.gte('renewal_date', startOfMonth).lt('renewal_date', nextDate)
        }

        const { data, error } = await query

        if (error) {
            console.error(error)
            setErrorMsg(error.message)
            setRenewals([])
        } else {
            const formatted = (data || []).map((row: any) => ({
                ...row,
                pipeline_stage: Array.isArray(row.pipeline_stage)
                    ? row.pipeline_stage[0] ?? null
                    : row.pipeline_stage,
            }))

            setRenewals(formatted)
        }

        setLoading(false)
    }

    useEffect(() => {
        load()
    }, [monthFilter, page])

    const handleQuickSave = async (id: string) => {
        const val = editValue === '' ? null : Number(editValue)
        const { error } = await supabase
            .from('temp_leads_basics')
            .update({ renewal_premium: val })
            .eq('id', id)
        
        if (!error) {
            setRenewals(prev => prev.map(r => r.id === id ? { ...r, renewal_premium: val ?? undefined } : r))
            setEditingId(null)
        }
    }

    const filteredRenewals = renewals.filter(r => {
        const term = searchTerm.toLowerCase()
        return (
            (r.client_name && r.client_name.toLowerCase().includes(term)) ||
            (r['business_name'] && r['business_name'].toLowerCase().includes(term)) ||
            (r.policy_number && r.policy_number.toLowerCase().includes(term)) ||
            (r.carrier && r.carrier.toLowerCase().includes(term))
        )
    })

    return (
        <div className="w-full max-w-[1600px] mx-auto min-h-screen">
            {errorMsg && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    <strong>Error Loading Renewals:</strong> {errorMsg}
                    <br />
                    <span>Check console for details.</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                        Personal Lines Renewals
                    </h1>
                   
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Month Picker */}
                    <div className="relative group flex items-center w-full sm:w-auto">
                        <Calendar className="absolute left-3 z-10 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-2.5 border border-emerald-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-emerald-500 shadow-sm text-gray-700 text-sm cursor-pointer"
                        />
                        {monthFilter && (
                            <button
                                onClick={() => setMonthFilter('')}
                                className="absolute right-3 text-gray-400 hover:text-gray-600 p-0.5 text-lg leading-none"
                                title="Clear filter"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <Link
                        href="/csr/renewals/personal/import"
                        className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all text-center flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                    >
                        <Download size={16} />
                        Import CSV
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search client, policy ID, or carrier..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                        {filteredRenewals.length} Renewal{filteredRenewals.length !== 1 && 's'} Found
                    </div>
                </div>

                {loading ? (
                    <Loading message="Fetching renewals..." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left" style={{ minWidth: '1200px' }}>
                            <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs border-b border-gray-100 tracking-wider">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4">Client</th>
                                    <th className="px-4 sm:px-6 py-4">Policy Type</th>
                                    <th className="px-4 sm:px-6 py-4">Policy ID</th>
                                    <th className="px-4 sm:px-6 py-4">Renewal Date</th>
                                    <th className="px-4 sm:px-6 py-4">Carrier</th>
                                    <th className="px-4 sm:px-6 py-4">Premium</th>
                                    <th className="px-4 sm:px-6 py-4 bg-cyan-500/10 text-cyan-50">Renewal Premium</th>
                                    <th className="px-4 sm:px-6 py-4">Referral</th>
                                    <th className="px-4 sm:px-6 py-4">Notes</th>
                                    <th className="px-4 sm:px-6 py-4">Stage</th>
                                    <th className="px-4 sm:px-6 py-4 text-center">View</th>
                                    <th className="px-4 sm:px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {filteredRenewals.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-6 py-12 text-center text-gray-500 text-sm">
                                            No renewals found for the selected month or search criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRenewals.map(r => (
                                        <tr key={r.id} className="hover:bg-gray-50 transition-colors group border-l-4 border-transparent hover:border-emerald-500 text-xs">
                                            <td className="px-4 sm:px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                                                {r['business_name'] || r.client_name}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 capitalize text-gray-700">
                                                {r.policy_type}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-500 font-mono">
                                                {r.policy_number || '—'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-700 font-semibold whitespace-nowrap">
                                                {new Date(r.renewal_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-700 whitespace-nowrap truncate max-w-[120px]" title={r.carrier}>
                                                {r.carrier || '—'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-900 font-bold">
                                                {r.current_premium ? `$${r.current_premium.toLocaleString()}` : '—'}
                                            </td>
                                            <td className={`px-4 sm:px-6 py-4 ${!r.renewal_premium ? 'bg-cyan-50' : ''}`}>
                                                {editingId === r.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            autoFocus
                                                            className="w-24 px-2 py-1 border-2 border-cyan-400 rounded-md outline-none text-xs font-bold"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            onBlur={() => handleQuickSave(r.id)}
                                                            onKeyDown={e => e.key === 'Enter' && handleQuickSave(r.id)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-black tracking-tight ${r.renewal_premium ? 'text-gray-900' : 'text-cyan-600'}`}>
                                                            {r.renewal_premium ? `$${r.renewal_premium.toLocaleString()}` : 'MISSING'}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(r.id)
                                                                setEditValue(r.renewal_premium?.toString() || '')
                                                            }}
                                                            className="text-[10px] text-cyan-600 hover:text-cyan-800 font-bold underline"
                                                        >
                                                            {r.renewal_premium ? 'Edit' : 'Enter'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-600 truncate max-w-[100px]" title={r.referral || ''}>
                                                {r.referral || '—'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-500 truncate max-w-[120px]" title={r.notes || ''}>
                                                {r.notes || '—'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border whitespace-nowrap
                                                    ${!r.pipeline_stage ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`
                                                }>
                                                    {r.pipeline_stage?.stage_name || 'New'}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-center">
                                                <Link
                                                    href={`/csr/renewals/${r.id}`}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold rounded-lg text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm transition whitespace-nowrap"
                                                >
                                                    Manage
                                                </Link>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-center">
                                                <Link
                                                    href={`/csr/leads/send-form?id=${r.id}`}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-[#2E5C85] hover:bg-[#234b6e] border border-transparent text-xs font-bold rounded-lg text-white shadow-sm transition whitespace-nowrap gap-1.5"
                                                >
                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    Send Email
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION CONTROLS */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500 font-medium">
                        Page {page + 1}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={renewals.length < 10 || loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
