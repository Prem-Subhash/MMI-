'use client'

import { useState, useEffect } from 'react'
import { Calendar, Download, Filter, FileText, FileSpreadsheet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/lib/toast'
import Loading, { Spinner } from '@/components/ui/Loading'

export default function MonthlyReportPage() {
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState<'excel' | 'pdf' | null>(null)
    

    // Constants for Line of Business
    const CATEGORIES = [
        { label: 'All Categories', value: '' },
        { label: 'Personal Line', value: 'personal' },
        { label: 'Commercial Line', value: 'commercial' }
    ]

    const LOB_OPTIONS: Record<string, string[]> = {
        commercial: [
            'Business Owners Policy (BOP)',
            'Commercial Auto',
            'commercial_package',
            'Umbrella (Excess Liability)',
            'General Liability',
            'Flood',
            'Builders Risk',
            'Lessor Risk',
            'Surety Bond',
            'Inland Marine',
            'Employment Practices Liability',
            'Cyber Liability',
            'Errors & Omissions / Professional Liability',
            'Liquor Liability',
            'Crime Fidelity Bond',
            'commercial_property'
        ],
        personal: [
            'Auto',
            'Home + Auto',
            'Condo',
            'Landlord Home/Condo',
            'motorcycle'
        ]
    }

    // Filters State
    const [filters, setFilters] = useState({
        dateType: 'effective' as 'effective' | 'expiration',
        fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        toDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        category: '',
        lineOfBusiness: [] as string[],
        csr: '',
        clientName: '',
        flow: ''
    })

    const [data, setData] = useState<any[]>([])
    const [filteredData, setFilteredData] = useState<any[]>([])
    const [totalRecords, setTotalRecords] = useState(0)
    const [csrs, setCsrs] = useState<any[]>([])
    const [isLOBDropdownOpen, setIsLOBDropdownOpen] = useState(false)

    useEffect(() => {
        const loadCsrs = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email')
            setCsrs(data || [])
        }
        loadCsrs()
    }, [])

    const loadReport = async () => {
        setLoading(true)
        try {
            const payload = {
                start_date: filters.fromDate,
                end_date: filters.toDate,
                date_type: filters.dateType,
                insurence_category: filters.category === 'all' ? '' : filters.category,
                line_of_businesses: filters.lineOfBusiness,
                assigned_csr: filters.csr,
                customer_name: filters.clientName,
                policy_flow: filters.flow,
                exportType: 'json',
                page: 1,
                limit: 50
            }

            const res = await fetch('/api/reports/monthly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}))
                const errorMsg = typeof errJson.error === 'object' 
                    ? JSON.stringify(errJson.error.fieldErrors || errJson.error) 
                    : errJson.error || 'Failed to load report'
                throw new Error(errorMsg)
            }

            const json = await res.json()
            if (json.error) throw new Error(json.error)

            const rawData = json.data || []
            
            setData(rawData)
            setFilteredData(rawData)
            setTotalRecords(json.pagination?.total || rawData.length)
        } catch (err: any) {
            console.error(err)
            toast('Error: ' + err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const resetFilters = () => {
        setFilters({
            dateType: 'effective',
            fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            toDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
            category: '',
            lineOfBusiness: [],
            csr: '',
            clientName: '',
            flow: ''
        })
        setData([])
        setFilteredData([])
        setTotalRecords(0)
        toast('Filters and Report Preview have been cleared.', 'success')
    }

    const setPreset = (type: 'thisMonth' | 'lastMonth' | 'thisYear') => {
        const now = new Date()
        let start = ''
        let end = ''

        if (type === 'thisMonth') {
            start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        } else if (type === 'lastMonth') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
            end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
        } else if (type === 'thisYear') {
            start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
            end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        }

        setFilters(prev => ({ ...prev, fromDate: start, toDate: end }))
    }

    const handleExport = async (type: 'excel' | 'pdf') => {
        setGenerating(type)
        toast('Your report is being processed. Please wait. The file will be downloaded shortly.', 'info', 6000)
        try {
            const payload = {
                start_date: filters.fromDate,
                end_date: filters.toDate,
                date_type: filters.dateType,
                insurence_category: filters.category,
                line_of_businesses: filters.lineOfBusiness,
                assigned_csr: filters.csr,
                customer_name: filters.clientName,
                policy_flow: filters.flow,
                exportType: type
            }

            const res = await fetch('/api/reports/monthly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const json = await res.json().catch(() => ({}))
                const errorMsg = typeof json.error === 'object'
                    ? JSON.stringify(json.error.fieldErrors || json.error)
                    : json.error || 'Export failed'
                throw new Error(errorMsg)
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            const dateStr = filters.fromDate + '_to_' + filters.toDate
            a.download = `Report_${dateStr}.${type === 'excel' ? 'xlsx' : 'pdf'}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err: any) {
            toast('Export Error: ' + err.message, 'error')
        } finally {
            setGenerating(null)
        }
    }

    return (
        <div className="w-full max-w-[1600px] mx-auto bg-gray-50/50 min-h-screen">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Monthly Reporting</h1>
                    <p className="text-gray-500 mt-1 text-sm">Generate and export detailed performance reports</p>
                </div>
                {/* Export Buttons */}
                <div className="flex flex-col xs:flex-row sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => handleExport('excel')}
                        disabled={!!generating}
                        className="flex items-center justify-center gap-2 bg-emerald-600 text-white border border-emerald-200 px-4 py-2.5 rounded-lg hover:bg-emerald-600 hover:border-emerald-300 hover:shadow-md disabled:opacity-50 shadow-sm transition-all font-medium text-sm whitespace-nowrap w-full sm:w-auto"
                    >
                        {generating === 'excel' ? <><Spinner size={16} /> Generating...</> : <><FileSpreadsheet size={16} /> Export Excel</>}
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={!!generating}
                        className="flex items-center justify-center gap-2 bg-rose-600 text-white border border-rose-200 px-4 py-2.5 rounded-lg hover:bg-rose-600 hover:border-rose-300 hover:shadow-md disabled:opacity-50 shadow-sm transition-all font-medium text-sm whitespace-nowrap w-full sm:w-auto"
                    >
                        {generating === 'pdf' ? <><Spinner size={16} /> Generating...</> : <><FileText size={16} /> Export PDF</>}
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Filter size={18} />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Advanced Report Filters</h2>
                    </div>
                    <button 
                        onClick={resetFilters}
                        className="text-md border-2 px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-300 hover:text-white transition-colors flex items-center gap-1"
                    >
                        Reset All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* --- DATE SECTION --- */}
                    <div className="space-y-4 col-span-1 md:col-span-2 lg:col-span-1">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-3 py-0.5 rounded-full w-fit">
                                Date Type
                            </label>
                            <div className="flex gap-4 mt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="dateType" 
                                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                        checked={filters.dateType === 'effective'}
                                        onChange={() => setFilters({...filters, dateType: 'effective'})}
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors">Effective Date</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="dateType" 
                                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                        checked={filters.dateType === 'expiration'}
                                        onChange={() => setFilters({...filters, dateType: 'expiration'})}
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors">Expiration Date</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">From</label>
                                <input
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">To</label>
                                <input
                                    type="date"
                                    value={filters.toDate}
                                    onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                            <button onClick={() => setPreset('thisMonth')} className="text-[10px] font-bold px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-200 hover:text-black transition-colors uppercase tracking-wide ">This Month</button>
                            <button onClick={() => setPreset('lastMonth')} className="text-[10px] font-bold px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-200 hover:text-black transition-colors uppercase tracking-wide">Last Month</button>
                            <button onClick={() => setPreset('thisYear')} className="text-[10px] font-bold px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-200 hover:text-black transition-colors uppercase tracking-wide">This Year</button>
                        </div>
                    </div>

                    {/* --- CATEGORY & LOB SECTION --- */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-3 py-0.5 rounded-full w-fit">
                                Category
                            </label>
                            <select
                                value={filters.category}
                                onChange={e => setFilters({ ...filters, category: e.target.value, lineOfBusiness: [] })}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            >
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2 relative">
                            <label className="text-[10px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-3 py-0.5 rounded-full w-fit">
                                Line of Business
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsLOBDropdownOpen(!isLOBDropdownOpen)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-left flex justify-between items-center group hover:border-emerald-300 transition-colors"
                            >
                                <span className="truncate text-gray-700">
                                    {filters.lineOfBusiness.length === 0 
                                        ? 'Select Multiple...' 
                                        : `${filters.lineOfBusiness.length} Selected`}
                                </span>
                                <Filter size={14} className="text-gray-400 group-hover:text-emerald-600" />
                            </button>
                            
                            {isLOBDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {!filters.category ? (
                                        <p className="text-xs text-gray-500 py-4 text-center italic">Please select a category first</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {LOB_OPTIONS[filters.category]?.map(lob => (
                                                <label key={lob} className="flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-50 cursor-pointer group transition-colors">
                                                    <input 
                                                        type="checkbox"
                                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                                        checked={filters.lineOfBusiness.includes(lob)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                lineOfBusiness: checked 
                                                                    ? [...prev.lineOfBusiness, lob]
                                                                    : prev.lineOfBusiness.filter(item => item !== lob)
                                                            }))
                                                        }}
                                                    />
                                                    <span className="text-xs text-gray-700 group-hover:text-emerald-900">{lob}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- CSR, FLOW & SEARCH --- */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-3 py-0.5 rounded-full w-fit whitespace-nowrap">
                                    CSR
                                </label>
                                <select
                                    value={filters.csr}
                                    onChange={e => setFilters({ ...filters, csr: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                >
                                    <option value="">All CSRs</option>
                                    {csrs.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-3 py-0.5 rounded-full w-fit">
                                    Flow
                                </label>
                                <select
                                    value={filters.flow}
                                    onChange={e => setFilters({ ...filters, flow: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                >
                                    <option value="">All Flows</option>
                                    <option value="new">New Business</option>
                                    <option value="renewal">Renewal</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-3 py-0.5 rounded-full w-fit">
                                Client Name
                            </label>
                            <input
                                type="text"
                                placeholder="Search client..."
                                value={filters.clientName}
                                onChange={e => setFilters({ ...filters, clientName: e.target.value })}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-gray-400 italic font-medium">
                        * Filtering by <span className="font-bold text-gray-600">{filters.dateType === 'effective' ? 'Effective Date' : 'Expiration Date'}</span>
                    </div>
                    <button
                        onClick={loadReport}
                        disabled={loading}
                        className="bg-brand text-white px-8 py-3 rounded-xl hover:bg-brand/80 transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 font-bold flex items-center gap-2 text-sm w-full sm:w-auto justify-center active:scale-95 disabled:opacity-70"
                    >
                        {loading ? <Spinner size={18} /> : <FileText size={18} />}
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FileSpreadsheet size={18} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Report Preview</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Preview of the data based on current filters</p>
                        </div>
                    </div>
                        <div className="flex items-center gap-2">
                            {filters.lineOfBusiness.length > 0 && (
                                <span className="hidden lg:inline-flex bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-tight">
                                    LOB Filter Active
                                </span>
                            )}
                            <span className="bg-white text-gray-600 px-4 py-1.5 rounded-xl text-xs font-bold border border-gray-200 shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                {totalRecords} Records Total
                            </span>
                        </div>
                    </div>

                {loading ? (
                    <Loading message="Generating report preview..." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[640px]">
                            <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs tracking-wider font-semibold border-b border-gray-200/60">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4">Client</th>
                                    <th className="px-4 sm:px-6 py-4">Type</th>
                                    <th className="px-4 sm:px-6 py-4">Category</th>
                                    <th className="px-4 sm:px-6 py-4">Flow</th>
                                    <th className="px-4 sm:px-6 py-4">Premium</th>
                                    <th className="px-4 sm:px-6 py-4">CSR</th>
                                    <th className="px-4 sm:px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <Filter size={28} className="text-gray-300" />
                                                </div>
                                                <h3 className="text-base font-semibold text-gray-900 mb-1">No Data Available</h3>
                                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                                    Adjust the filters above and click "Generate Report" to view results.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (filteredData.map((row: any, index: number) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {row.client_name}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200 font-medium capitalize whitespace-nowrap">
                                                {row.policy_type}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 capitalize text-gray-600 whitespace-nowrap">
                                            {row.insurence_category}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize whitespace-nowrap
                                                ${row.policy_flow === 'new'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }
                                            `}>
                                                {row.policy_flow === 'new' ? 'New Business' : 'Renewal'}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                                            ${(row.total_premium || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white flex-shrink-0">
                                                    {(row.assigned_csr_profile?.name || row.assigned_user_profile?.full_name || 'U')[0]}
                                                </div>
                                                <span className="text-sm whitespace-nowrap">
                                                    {row.assigned_csr_profile?.name || row.assigned_user_profile?.full_name || row.assigned_csr || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                                            {filters.dateType === 'effective' 
                                                ? (row.effective_date || '-') 
                                                : (row.renewal_date || row.effective_date || '-')}
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
