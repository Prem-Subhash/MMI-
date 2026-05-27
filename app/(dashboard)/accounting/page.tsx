import React from 'react'
import Link from 'next/link'
import { DollarSign, Percent, FileText, AlertCircle, Activity, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

export default function AccountingDashboard() {
    // Hardcoded metrics for demonstration purposes
    const stats = [
        {
            label: 'Total Premium',
            value: formatCurrency(7850),
            icon: <DollarSign size={22} />,
            href: '/accounting/all-leads',
            description: 'Bound premium across all lines',
            accent: 'from-[#2E5C85] to-[#1e3f5e]',
            glow: 'shadow-blue-200/60',
            iconBg: 'bg-blue-50 text-[#2E5C85]',
            hoverIconBg: 'group-hover:bg-[#2E5C85] group-hover:text-white',
            bar: 'bg-[#2E5C85]',
        },
        {
            label: 'Expected Comm',
            value: formatCurrency(1177.50),
            icon: <Percent size={22} />,
            href: '/accounting/all-leads',
            description: 'Calculated expected commissions',
            accent: 'from-[#10B889] to-[#0d9470]',
            glow: 'shadow-emerald-200/60',
            iconBg: 'bg-emerald-50 text-[#10B889]',
            hoverIconBg: 'group-hover:bg-[#10B889] group-hover:text-white',
            bar: 'bg-[#10B889]',
        },
        {
            label: 'Collected Comm',
            value: formatCurrency(970),
            icon: <FileText size={22} />,
            href: '/accounting/reports',
            description: 'Actual collected commissions',
            accent: 'from-purple-600 to-indigo-600',
            glow: 'shadow-purple-200/60',
            iconBg: 'bg-purple-50 text-purple-600',
            hoverIconBg: 'group-hover:bg-purple-600 group-hover:text-white',
            bar: 'bg-purple-600',
        },
        {
            label: 'Discrepancies',
            value: '1 Pending',
            icon: <AlertCircle size={22} />,
            href: '/accounting/all-leads',
            description: 'Unmatched commission payments',
            accent: 'from-[#E07A5F] to-[#c9664d]',
            glow: 'shadow-orange-200/60',
            iconBg: 'bg-orange-50 text-[#E07A5F]',
            hoverIconBg: 'group-hover:bg-[#E07A5F] group-hover:text-white',
            bar: 'bg-[#E07A5F]',
        },
    ]

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                        Accounting Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm max-w-2xl">
                        Monitor bound premiums, track commissions, and manage reconciliations.
                    </p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="bg-[#E07A5F] border border-[#E07A5F] text-white hover:bg-[#E07A5F]/90 px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                        <Download size={18} />
                        Export Financials
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.href} className="group">
                        <div className={`
                            relative bg-white rounded-2xl border border-gray-100 p-5
                            shadow-sm hover:shadow-lg active:shadow-lg ${stat.glow}
                            hover:-translate-y-1 active:-translate-y-1
                            hover:border-transparent active:border-transparent
                            transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col gap-1.5
                        `}>
                            {/* Top accent bar */}
                            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.accent}
                                transform scale-x-0 group-hover:scale-x-100 group-active:scale-x-100
                                transition-transform duration-300 origin-left rounded-t-2xl`}
                            />

                            <div className="flex items-center gap-2">
                                <div className={`
                                    p-2 rounded-lg ${stat.iconBg} ${stat.hoverIconBg}
                                    transition-all duration-300 inline-flex
                                    group-hover:scale-110 group-active:scale-110
                                `}>
                                    {React.cloneElement(stat.icon as React.ReactElement<{ size: number }>, { size: 14 })}
                                </div>
                                <p className="text-[12px] font-black uppercase tracking-wider leading-none text-gray-500 group-hover:text-gray-700 transition-colors">
                                    {stat.label}
                                </p>
                            </div>
                            <p className="text-[20px] font-black text-gray-900 leading-tight">
                                {stat.value}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold leading-tight">
                                {stat.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Recent Activity ── */}
            <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                        <Activity size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Recent Accounting Activity</h2>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-10 text-center border-b border-gray-100">
                        <p className="text-gray-400 text-sm">No recent transactions or reconciliations to display.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
