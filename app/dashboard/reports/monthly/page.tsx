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
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Monthly Reporting</h1>
                    <p className="text-gray-500 mt-1">Generate and export performance reports</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('excel')}
                        disabled={!!generating}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {generating === 'excel' ? 'Generating...' : <> <FileSpreadsheet size={18} /> Export Excel </>}
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={!!generating}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {generating === 'pdf' ? 'Generating...' : <> <FileText size={18} /> Export PDF </>}
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
                    <Filter size={18} /> Filters
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* Month */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Month</label>
                        <input type="month" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} className="p-2 border rounded-lg text-sm" />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Category</label>
                        <select value={filters.insurence_category} onChange={e => setFilters({ ...filters, insurence_category: e.target.value })} className="p-2 border rounded-lg text-sm">
                            <option value="">All Categories</option>
                            <option value="personal">Personal Line</option>
                            <option value="commercial">Commercial Line</option>
                        </select>
                    </div>

                    {/* Policy Type */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Policy Type</label>
                        <select value={filters.policy_type} onChange={e => setFilters({ ...filters, policy_type: e.target.value })} className="p-2 border rounded-lg text-sm">
                            <option value="">All Types</option>
                            <option value="auto">Auto</option>
                            <option value="home">Home</option>
                            <option value="commercial_auto">Comm. Auto</option>
                            <option value="gl">General Liability</option>
                        </select>
                    </div>

                    {/* Flow */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Flow</label>
                        <select value={filters.policy_flow} onChange={e => setFilters({ ...filters, policy_flow: e.target.value })} className="p-2 border rounded-lg text-sm">
                            <option value="">All Flows</option>
                            <option value="new">New Business</option>
                            <option value="renewal">Renewal</option>
                        </select>
                    </div>

                    {/* CSR (Visible but might be restricted by API) */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">CSR</label>
                        <select value={filters.assigned_csr} onChange={e => setFilters({ ...filters, assigned_csr: e.target.value })} className="p-2 border rounded-lg text-sm">
                            <option value="">All CSRs</option>
                            {csrs.map(c => (
                                <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">Client Name</label>
                        <input type="text" placeholder="Search..." value={filters.customer_name} onChange={e => setFilters({ ...filters, customer_name: e.target.value })} className="p-2 border rounded-lg text-sm" />
                    </div>

                </div>

                <div className="mt-4 flex justify-end">
                    <button onClick={loadReport} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 flex justify-between">
                    <span>Report Preview</span>
                    <span className="text-sm font-normal text-gray-500">{data.length} Records found</span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Client</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Flow</th>
                                    <th className="px-6 py-3">Premium</th>
                                    <th className="px-6 py-3">CSR</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No records found. Adjust filters and click Generate.</td></tr>
                                ) : (data.map((row: any) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium">{row.client_name}</td>
                                        <td className="px-6 py-3 capitalize">{row.policy_type}</td>
                                        <td className="px-6 py-3 capitalize">{row.insurence_category}</td>
                                        <td className="px-6 py-3 capitalize">{row.policy_flow}</td>
                                        <td className="px-6 py-3 font-semibold">${(row.total_premium || 0).toLocaleString()}</td>
                                        <td className="px-6 py-3">{row.assigned_csr_profile?.full_name || 'Unknown'}</td>
                                        <td className="px-6 py-3">{row.renewal_date || new Date(row.created_at).toLocaleDateString()}</td>
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
