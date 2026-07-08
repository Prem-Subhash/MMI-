import React from 'react'
import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import {
    Users, FileText, BarChart2, Briefcase,
    DollarSign, Activity, Settings, ListTodo,
    ArrowRight, Shield, ArrowLeft
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

export default async function SuperAdminDashboard() {
    const supabase = await createServer()

    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    const { count: totalLeads } = await supabase
        .from('temp_leads_basics')
        .select('*', { count: 'exact', head: true })

    const { count: activePipelines } = await supabase
        .from('pipelines')
        .select('*', { count: 'exact', head: true })

    const { data: leads } = await supabase
        .from('temp_leads_basics')
        .select(`
            id,
            total_premium,
            stage_metadata,
            current_stage:pipeline_stages (
                stage_name
            )
        `)

    let totalBoundPremium = 0
    let totalQuotesSent = 0

    leads?.forEach(lead => {
        // @ts-ignore
        const stageName = lead.current_stage?.stage_name || ''
        if (stageName.includes('Completed') || stageName.includes('Bound')) {
            const meta = lead.stage_metadata as any
            if (meta?.bound_premium) {
                totalBoundPremium += Number(meta.bound_premium) || 0
            } else if (lead.total_premium) {
                totalBoundPremium += Number(lead.total_premium) || 0
            }
        }
        if (stageName.includes('Quote') || stageName.includes('Quoted')) {
            totalQuotesSent++
        }
    })

    const stats = [
        {
            label: 'Total Users',
            value: totalUsers || 0,
            icon: <Users size={22} />,
            href: '/superadmin/users',
            description: 'All registered accounts',
            accent: 'from-[#10B889] to-[#0d9470]',
            glow: 'shadow-emerald-200/60',
            iconBg: 'bg-emerald-50 text-emerald-600',
            hoverIconBg: 'group-hover:bg-[#10B889] group-hover:text-white group-active:bg-[#10B889] group-active:text-white',
            bar: 'bg-[#10B889]',
        },
        {
            label: 'Total Leads',
            value: totalLeads || 0,
            icon: <FileText size={22} />,
            href: '/admin/leads',
            description: 'Across all pipelines',
            accent: 'from-[#2E5C85] to-[#1e3f5e]',
            glow: 'shadow-blue-200/60',
            iconBg: 'bg-blue-50 text-blue-600',
            hoverIconBg: 'group-hover:bg-[#2E5C85] group-hover:text-white group-active:bg-[#2E5C85] group-active:text-white',
            bar: 'bg-[#2E5C85]',
        },
        {
            label: 'Active Pipelines',
            value: activePipelines || 0,
            icon: <Briefcase size={22} />,
            href: '/superadmin/pipelines',
            description: 'Configured pipelines',
            accent: 'from-amber-500 to-orange-500',
            glow: 'shadow-amber-200/60',
            iconBg: 'bg-amber-50 text-amber-600',
            hoverIconBg: 'group-hover:bg-amber-500 group-hover:text-white group-active:bg-amber-500 group-active:text-white',
            bar: 'bg-amber-500',
        },
        {
            label: 'Bound Premium',
            value: formatCurrency(totalBoundPremium),
            icon: <DollarSign size={22} />,
            href: '/accounting',
            description: 'Total completed value',
            accent: 'from-purple-600 to-indigo-600',
            glow: 'shadow-purple-200/60',
            iconBg: 'bg-purple-50 text-purple-600',
            hoverIconBg: 'group-hover:bg-purple-600 group-hover:text-white group-active:bg-purple-600 group-active:text-white',
            bar: 'bg-purple-600',
        },
        {
            label: 'Quotes Sent',
            value: totalQuotesSent,
            icon: <BarChart2 size={22} />,
            href: '/admin/pipelines',
            description: 'Leads in quoting stage',
            accent: 'from-rose-500 to-pink-600',
            glow: 'shadow-rose-200/60',
            iconBg: 'bg-rose-50 text-rose-500',
            hoverIconBg: 'group-hover:bg-rose-500 group-hover:text-white group-active:bg-rose-500 group-active:text-white',
            bar: 'bg-rose-500',
        },
    ]

    const quickLinks = [
        {
            label: 'System Settings',
            href: '/superadmin/system-settings',
            icon: <Settings size={18} />,
            description: 'Global config & defaults',
            accent: 'from-[#10B889] to-[#0d9470]',
            iconBg: 'bg-emerald-50 text-emerald-600',
            hoverIcon: 'group-hover:bg-[#10B889] group-hover:text-white group-active:bg-[#10B889] group-active:text-white',
        },
        {
            label: 'Audit Logs',
            href: '/superadmin/audit-logs',
            icon: <Activity size={18} />,
            description: 'System activity history',
            accent: 'from-[#2E5C85] to-[#1e3f5e]',
            iconBg: 'bg-blue-50 text-blue-600',
            hoverIcon: 'group-hover:bg-[#2E5C85] group-hover:text-white group-active:bg-[#2E5C85] group-active:text-white',
        },
        {
            label: 'Email Templates',
            href: '/superadmin/email-templates',
            icon: <FileText size={18} />,
            description: 'Manage outbound emails',
            accent: 'from-amber-500 to-orange-500',
            iconBg: 'bg-amber-50 text-amber-600',
            hoverIcon: 'group-hover:bg-amber-500 group-hover:text-white group-active:bg-amber-500 group-active:text-white',
        },
        {
            label: 'Form Builder',
            href: '/superadmin/forms',
            icon: <ListTodo size={18} />,
            description: 'Build client intake forms',
            accent: 'from-purple-600 to-indigo-600',
            iconBg: 'bg-purple-50 text-purple-600',
            hoverIcon: 'group-hover:bg-purple-600 group-hover:text-white group-active:bg-purple-600 group-active:text-white',
        },
        {
            label: 'Roles & Access',
            href: '/superadmin/roles',
            icon: <Shield size={18} />,
            description: 'User permission control',
            accent: 'from-rose-500 to-pink-600',
            iconBg: 'bg-rose-50 text-rose-500',
            hoverIcon: 'group-hover:bg-rose-500 group-hover:text-white group-active:bg-rose-500 group-active:text-white',
        },
    ]

    return (
        <div className="p-4 sm:p-6 lg:p-8">

            {/* ── Header ── */}
            <div className="mb-8 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                        Super Admin Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm max-w-2xl">
                        Comprehensive overview of system metrics, users, and global configurations.
                    </p>
                </div>
                <Link
                    href="/"
                    title="Back to Home"
                    aria-label="Back to Home"
                    className="flex items-center justify-center gap-1.5 p-2 md:px-3.5 md:py-2 rounded-full md:rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-[#10B889] text-xs md:text-sm font-bold transition-all shadow-sm hover:shadow group flex-shrink-0"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5 flex-shrink-0" />
                    <span className="hidden md:inline">Back to Home</span>
                </Link>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
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
                                    {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 14 })}
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

            {/* ── Quick Actions ── */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                        <Activity size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Quick Actions</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {quickLinks.map((link, i) => (
                        <Link key={i} href={link.href} className="group">
                            <div className={`
                                relative bg-white rounded-2xl border border-gray-100 p-5
                                shadow-sm hover:shadow-md active:shadow-md
                                hover:-translate-y-0.5 active:-translate-y-0.5
                                hover:border-transparent active:border-transparent
                                transition-all duration-300 overflow-hidden cursor-pointer h-full
                            `}>
                                {/* Top accent bar */}
                                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${link.accent}
                                    transform scale-x-0 group-hover:scale-x-100 group-active:scale-x-100
                                    transition-transform duration-300 origin-left rounded-t-2xl`}
                                />

                                <div className={`
                                    p-2.5 rounded-xl ${link.iconBg} ${link.hoverIcon}
                                    transition-all duration-300 inline-flex mb-3
                                    group-hover:scale-110 group-active:scale-110
                                `}>
                                    {link.icon}
                                </div>
                                <p className="text-sm font-bold text-gray-800 group-hover:text-gray-900 group-active:text-gray-900 transition-colors">
                                    {link.label}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                                    {link.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    )
}
