import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import { DownloadCloud, PieChart, Activity, TrendingUp } from 'lucide-react'

export default async function AdminReportsPage() {
    const supabase = await createServer()

    // Simple aggregation: total converted vs not. (In reality you'd want a more complex analytics query)
    const { count: totalLeads } = await supabase.from('temp_leads_basics').select('*', { count: 'exact', head: true })

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Operational Reports</h1>
                        <p className="text-gray-600 mt-1">Generate, view, and export overall CRM analytics.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <button className="w-full sm:w-auto px-5 py-2.5 bg-[#2E5C85] text-white rounded-lg shadow-sm hover:bg-[#224869] transition-all flex items-center justify-center gap-2 font-bold whitespace-nowrap">
                            <DownloadCloud size={18} />
                            Export CSV
                        </button>
                        <Link href="/admin" className="w-full sm:w-auto">
                            <button className="w-full px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-bold">
                                Back
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-lg"><PieChart size={24} /></div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total System Volume</p>
                            <p className="text-2xl font-bold text-gray-800">{totalLeads || 0}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={24} /></div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pipeline Health</p>
                            <p className="text-2xl font-bold text-gray-800">84%</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={24} /></div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                            <p className="text-2xl font-bold text-gray-800">12.5%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow border p-8 md:p-12 text-center">
                    <div className="inline-flex justify-center items-center w-20 h-20 bg-gray-50 rounded-full mb-4">
                        <BarChartPlaceholder />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Extended Reporting Coming Soon</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">
                        Advanced cohort analysis, stage duration latency, and CSR velocity metrics will visually populate here in Phase 2.
                    </p>
                </div>
            </div>
        </div>
    )
}

function BarChartPlaceholder() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
    )
}
