import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import { DownloadCloud, PieChart, Activity, TrendingUp } from 'lucide-react'

export default async function AdminReportsPage() {
    const supabase = await createServer()

    // Simple aggregation: total converted vs not. (In reality you'd want a more complex analytics query)
    const { count: totalLeads } = await supabase.from('temp_leads_basics').select('*', { count: 'exact', head: true })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Operational Reports</h1>
                    <p className="text-gray-600">Generate, view, and export overall CRM analytics.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-[#2E5C85] text-white rounded-lg shadow-sm hover:bg-[#224869] transition flex items-center gap-2 font-medium">
                        <DownloadCloud size={18} />
                        Export CSV
                    </button>
                    <Link href="/admin">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                            Back
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            <div className="bg-white rounded-xl shadow border p-12 text-center">
                <div className="inline-flex justify-center items-center w-20 h-20 bg-gray-50 rounded-full mb-4">
                    <BarChartPlaceholder />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Extended Reporting Coming Soon</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                    Advanced cohort analysis, stage duration latency, and CSR velocity metrics will visually populate here in Phase 2.
                </p>
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
