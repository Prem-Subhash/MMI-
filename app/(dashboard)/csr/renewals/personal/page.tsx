'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Calendar, Download, Search } from 'lucide-react'

type Renewal = {
    id: string
    client_name: string
    policy_type: string
    renewal_date: string
    carrier?: string
    current_premium?: number
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
        <Suspense fallback={<div>Loading...</div>}>
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

    useEffect(() => {
        setPage(0)
    }, [monthFilter])

    useEffect(() => {
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

        load()
    }, [monthFilter, page])

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
                    <p className="text-gray-500 mt-1 text-sm">Manage and track upcoming policy renewals</p>
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
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm">Loading renewals...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left" style={{ minWidth: '900px' }}>
                            <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Client</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Policy Type</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Policy ID</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Renewal Date</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Carrier</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Premium</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Referral</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Notes</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold">Stage</th>
                                    <th className="px-4 sm:px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {filteredRenewals.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500 text-sm">
                                            No renewals found for the selected month or search criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRenewals.map(r => (
                                        <tr key={r.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                                                {r['business_name'] || r.client_name}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className="capitalize px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200 whitespace-nowrap">
                                                    {r.policy_type}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                                                {r.policy_number || '—'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-700 font-medium whitespace-nowrap">
                                                {new Date(r.renewal_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-700 whitespace-nowrap">{r.carrier || '—'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-900 font-semibold whitespace-nowrap">
                                                {r.current_premium ? `$${r.current_premium.toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-600">{r.referral || '—'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-gray-500 max-w-[160px] truncate" title={r.notes || ''}>
                                                {r.notes || '—'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap
                                                    ${!r.pipeline_stage ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`
                                                }>
                                                    {r.pipeline_stage?.stage_name || 'New'}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-right">
                                                <Link
                                                    href={`/csr/renewals/${r.id}`}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 whitespace-nowrap"
                                                >
                                                    Manage
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
