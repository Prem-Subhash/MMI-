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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

                    {/* Card 1 — Total System Volume */}
                    <div className="relative bg-gradient-to-br from-[#10B889] to-[#0d9470] rounded-2xl p-6 shadow-lg shadow-emerald-200/50 overflow-hidden text-white">
                        {/* Decorative circles */}
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
                        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/10" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Layers size={22} className="text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                    <ArrowUpRight size={12} />
                                    Live
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Total System Volume</p>
                            <p className="text-4xl font-black mt-1 tracking-tight">{totalLeads || 0}</p>
                            <p className="text-xs text-white/70 mt-2 font-medium">Active leads across all pipelines</p>
                        </div>
                    </div>

                    {/* Card 2 — Pipeline Health */}
                    <div className="relative bg-gradient-to-br from-[#2E5C85] to-[#1e3f5e] rounded-2xl p-6 shadow-lg shadow-blue-200/50 overflow-hidden text-white">
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
                        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/10" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Activity size={22} className="text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                    <Zap size={12} />
                                    Healthy
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Pipeline Health</p>
                            <p className="text-4xl font-black mt-1 tracking-tight">{pipelineHealth}%</p>
                            {/* Progress bar */}
                            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-700"
                                    style={{ width: `${pipelineHealth}%` }}
                                />
                            </div>
                            <p className="text-xs text-white/70 mt-2 font-medium">Stages progressing on track</p>
                        </div>
                    </div>

                    {/* Card 3 — Conversion Rate */}
                    <div className="relative bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-2xl p-6 shadow-lg shadow-purple-200/50 overflow-hidden text-white sm:col-span-2 lg:col-span-1">
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
                        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/10" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <TrendingUp size={22} className="text-white" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                    <ArrowUpRight size={12} />
                                    +2.1%
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Conversion Rate</p>
                            <p className="text-4xl font-black mt-1 tracking-tight">{conversionRate}%</p>
                            {/* Progress bar */}
                            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-700"
                                    style={{ width: `${conversionRate * 4}%` }}
                                />
                            </div>
                            <p className="text-xs text-white/70 mt-2 font-medium">Leads closed vs. total received</p>
                        </div>
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
