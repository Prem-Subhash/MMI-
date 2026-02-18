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
    pipeline_stage: {
        stage_name: string
    } | null
}

export default function CommercialRenewalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CommercialRenewalContent />
        </Suspense>
    )
}

function CommercialRenewalContent() {
    const [renewals, setRenewals] = useState<Renewal[]>([])
    const [loading, setLoading] = useState(true)
    const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7)) // Default to current month YYYY-MM
    const [searchTerm, setSearchTerm] = useState('')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
                .eq('insurence_category', 'commercial')
                .eq('assigned_csr', user.id)
                .order('renewal_date', { ascending: true })

            // Apply Month Filter
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
    }, [monthFilter])

    // Simple client-side search filtering
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
        <div className="p-8 max-w-[1600px] mx-auto">
            {errorMsg && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <strong>Error Loading Renewals:</strong> {errorMsg}
                    <br />
                    <span className="text-sm">Check console for details. This might be due to a missing foreign key relationship.</span>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Commercial Lines Renewals
                    </h1>
                    <p className="text-gray-500 mt-1">Manage and track your upcoming policy renewals</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group flex items-center">
                        <Calendar className="absolute left-3 z-10 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-sm text-gray-700 cursor-pointer"
                        />
                        {monthFilter && (
                            <button
                                onClick={() => setMonthFilter('')}
                                className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
                                title="Clear filter"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <Link
                        href="/dashboard/renewals/commercial/import"
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
                    >
                        <Download size={18} />
                        Import CSV
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search client, policy ID, or carrier..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        {filteredRenewals.length} Renewal{filteredRenewals.length !== 1 && 's'} Found
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p>Loading renewals...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Client</th>
                                    <th className="px-6 py-4 font-semibold">Policy Type</th>
                                    <th className="px-6 py-4 font-semibold">Policy ID</th>
                                    <th className="px-6 py-4 font-semibold">Renewal Date</th>
                                    <th className="px-6 py-4 font-semibold">Carrier</th>
                                    <th className="px-6 py-4 font-semibold">Premium</th>
                                    <th className="px-6 py-4 font-semibold">Referral</th>
                                    <th className="px-6 py-4 font-semibold max-w-[200px]">Notes</th>
                                    <th className="px-6 py-4 font-semibold">Stage</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {filteredRenewals.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                                            No renewals found for the selected month or search criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRenewals.map(r => (
                                        <tr key={r.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                {r['business_name'] || r.client_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">
                                                    {r.policy_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {r.policy_number || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 font-medium whitespace-nowrap">
                                                {new Date(r.renewal_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">{r.carrier || '—'}</td>
                                            <td className="px-6 py-4 text-gray-900 font-semibold">
                                                {r.current_premium ? `$${r.current_premium.toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {r.referral || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate" title={r.notes || ''}>
                                                {r.notes || '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${!r.pipeline_stage ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-100'}
                        `}>
                                                    {r.pipeline_stage?.stage_name || 'New'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/dashboard/renewals/${r.id}`}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
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
            </div>
        </div>
    )
}
