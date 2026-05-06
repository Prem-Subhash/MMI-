import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import { DownloadCloud, Layers, Activity, TrendingUp, ArrowUpRight, BarChart3, Zap, Clock } from 'lucide-react'

export default async function AdminReportsPage() {
    const supabase = await createServer()

    const { count: totalLeads } = await supabase
        .from('temp_leads_basics')
        .select('*', { count: 'exact', head: true })

    const pipelineHealth = 84
    const conversionRate = 12.5

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-7xl mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                            Operational Reports
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Generate, view, and export overall CRM analytics.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <button className="w-full sm:w-auto px-5 py-2.5 bg-[#2E5C85] text-white rounded-lg shadow-sm hover:bg-[#224869] transition-all flex items-center justify-center gap-2 font-bold whitespace-nowrap">
                            <DownloadCloud size={18} />
                            Export CSV
                        </button>
                        <Link href="/admin" className="w-full sm:w-auto">
                            <button className="w-full px-5 py-2.5 bg-[#E07A5F] text-white rounded-lg hover:bg-[#E07A5F]/80 transition-all font-bold">
                                Back
                            </button>
                        </Link>
                    </div>
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">

                    {/* Card 1 — Total System Volume */}
                    <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Layers size={14} className="text-gray-400" />
                            <p className="text-[12px] font-black uppercase tracking-wider leading-none">Total System Volume</p>
                        </div>
                        <div className="flex items-center gap-2 pl-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,184,137,0.4)]" />
                            <p className="text-[18px] font-black text-gray-900 leading-tight">
                                {totalLeads || 0}
                            </p>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold leading-tight">Active leads across all pipelines</p>
                    </div>

                    {/* Card 2 — Pipeline Health */}
                    <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Activity size={14} className="text-gray-400" />
                            <p className="text-[12px] font-black uppercase tracking-wider leading-none">Pipeline Health</p>
                        </div>
                        <div className="flex items-center gap-2 pl-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                            <p className="text-[18px] font-black text-gray-900 leading-tight">
                                {pipelineHealth}%
                            </p>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold leading-tight">Stages progressing on track</p>
                    </div>

                    {/* Card 3 — Conversion Rate */}
                    <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 text-gray-500">
                            <TrendingUp size={14} className="text-gray-400" />
                            <p className="text-[12px] font-black uppercase tracking-wider leading-none">Conversion Rate</p>
                        </div>
                        <div className="flex items-center gap-2 pl-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                            <p className="text-[18px] font-black text-gray-900 leading-tight">
                                {conversionRate}%
                            </p>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold leading-tight">Leads closed vs. total received</p>
                    </div>
                </div>

                {/* ── Coming Soon Panel ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 p-5 flex items-center gap-3">
                        <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 text-base">Advanced Analytics</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Phase 2 reporting suite</p>
                        </div>
                        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Clock size={10} />
                            Coming Soon
                        </span>
                    </div>
                    <div className="p-10 md:p-16 text-center">
                        {/* Animated bar chart illustration */}
                        <div className="flex items-end justify-center gap-2 h-16 mb-6">
                            {[40, 70, 55, 85, 60, 90, 45].map((h, i) => (
                                <div
                                    key={i}
                                    className="w-6 rounded-t-md opacity-20"
                                    style={{
                                        height: `${h}%`,
                                        background: i % 2 === 0 ? '#10B889' : '#2E5C85',
                                    }}
                                />
                            ))}
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">Extended Reporting Coming Soon</h3>
                        <p className="text-gray-400 max-w-md mx-auto mt-2 text-sm leading-relaxed">
                            Advanced cohort analysis, stage duration latency, and CSR velocity metrics
                            will visually populate here in Phase 2.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                            {['Cohort Analysis', 'Stage Latency', 'CSR Velocity', 'Funnel Drops'].map(tag => (
                                <span key={tag} className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
