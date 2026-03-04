'use client'

import { useState, useEffect } from 'react'
import { Calendar, Download, Filter, FileText, FileSpreadsheet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function MonthlyReportPage() {
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState<'excel' | 'pdf' | null>(null)

    // Filters
    const [filters, setFilters] = useState({
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        policy_type: '',
        insurence_category: '',
        policy_flow: '',
        assigned_csr: '',
        customer_name: ''
    })

    const [data, setData] = useState<any[]>([])
    const [csrs, setCsrs] = useState<any[]>([])

    // Load CSRs for filter
    useEffect(() => {
        const loadCsrs = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email')
            setCsrs(data || [])
        }
        loadCsrs()
    }, [])

    // Load Report Data (JSON Preview)
    const loadReport = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/reports/monthly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...filters, exportType: 'json' })
            })

            if (!res.ok) throw new Error('Failed to load report')

            const json = await res.json()
            if (json.error) throw new Error(json.error)

            setData(json || [])
        } catch (err: any) {
            console.error(err)
            alert('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle Export
    const handleExport = async (type: 'excel' | 'pdf') => {
        setGenerating(type)
        try {
            const res = await fetch('/api/reports/monthly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...filters, exportType: type })
            })

            if (!res.ok) {
                const json = await res.json().catch(() => ({}))
                throw new Error(json.error || 'Export failed')
            }

            // Download
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Monthly_Report_${filters.month}.${type === 'excel' ? 'xlsx' : 'pdf'}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err: any) {
            alert('Export Error: ' + err.message)
        } finally {
            setGenerating(null)
        }
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto bg-gray-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Monthly Reporting</h1>
                    <p className="text-gray-500 mt-1">Generate and export detailed performance reports</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleExport('excel')}
                        disabled={!!generating}
                        className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50 shadow-sm transition-all font-medium"
                    >
                        {generating === 'excel' ? 'Generating...' : <> <FileSpreadsheet size={18} /> Export Excel </>}
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={!!generating}
                        className="flex items-center gap-2 bg-white text-rose-600 border border-rose-200 px-4 py-2.5 rounded-lg hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50 shadow-sm transition-all font-medium"
                    >
                        {generating === 'pdf' ? 'Generating...' : <> <FileText size={18} /> Export PDF </>}
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6 mb-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Filter size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Report Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {/* Month */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Month
                        </label>
                        <input
                            type="month"
                            value={filters.month}
                            onChange={e => setFilters({ ...filters, month: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Category
                        </label>
                        <select
                            value={filters.insurence_category}
                            onChange={e => setFilters({ ...filters, insurence_category: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">All Categories</option>
                            <option value="personal">Personal Line</option>
                            <option value="commercial">Commercial Line</option>
                        </select>
                    </div>

                    {/* Policy Type */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Policy Type
                        </label>
                        <select
                            value={filters.policy_type}
                            onChange={e => setFilters({ ...filters, policy_type: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">All Types</option>
                            <option value="auto">Auto</option>
                            <option value="home">Home</option>
                            <option value="commercial_auto">Comm. Auto</option>
                            <option value="gl">General Liability</option>
                        </select>
                    </div>

                    {/* Flow */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Flow
                        </label>
                        <select
                            value={filters.policy_flow}
                            onChange={e => setFilters({ ...filters, policy_flow: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">All Flows</option>
                            <option value="new">New Business</option>
                            <option value="renewal">Renewal</option>
                        </select>
                    </div>

                    {/* CSR */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            CSR
                        </label>
                        <select
                            value={filters.assigned_csr}
                            onChange={e => setFilters({ ...filters, assigned_csr: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">All CSRs</option>
                            {csrs.map(c => (
                                <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Client Name
                        </label>
                        <input
                            type="text"
                            placeholder="Search client..."
                            value={filters.customer_name}
                            onChange={e => setFilters({ ...filters, customer_name: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={loadReport}
                        className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                    >
                        <FileText size={18} /> Generate Report
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Report Preview</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Preview of the data based on current filters</p>
                        </div>
                    </div>
                    <span className="bg-white text-gray-600 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 shadow-sm">
                        {data.length} Records Found
                    </span>
                </div>

                {loading ? (
                    <div className="p-20 text-center text-gray-500 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-medium text-gray-600">Generating report preview...</p>
                        <p className="text-sm text-gray-400 mt-1">This may take a moment</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-600 uppercase text-xs tracking-wider font-semibold border-b border-gray-200/60">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Flow</th>
                                    <th className="px-6 py-4">Premium</th>
                                    <th className="px-6 py-4">CSR</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <Filter size={32} className="text-gray-300" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Data Available</h3>
                                                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                                    Adjust the filters above and click "Generate Report" to view results.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (data.map((row: any, index: number) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {row.client_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200 font-medium capitalize">
                                                {row.policy_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 capitalize text-gray-600">
                                            {row.insurence_category}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize
                                                ${row.policy_flow === 'new'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }
                                            `}>
                                                {row.policy_flow === 'new' ? 'New Business' : 'Renewal'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            ${(row.total_premium || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                                    {(row.assigned_csr_profile?.full_name || 'U')[0]}
                                                </div>
                                                <span className="text-sm">
                                                    {row.assigned_csr_profile?.full_name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                            {row.renewal_date || new Date(row.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
