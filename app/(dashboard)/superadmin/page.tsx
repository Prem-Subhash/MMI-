import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import {
    Users, FileText, BarChart2, Briefcase,
    DollarSign, Activity, Settings, ListTodo,
    ArrowRight, Shield
} from 'lucide-react'

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
            value: `$${totalBoundPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                    Super Admin Dashboard
                </h1>
                <p className="text-gray-500 mt-1 text-sm max-w-2xl">
                    Comprehensive overview of system metrics, users, and global configurations.
                </p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5 mb-10">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.href} className="group">
                        <div className={`
                            relative bg-white rounded-2xl border border-gray-100 p-6
                            shadow-md hover:shadow-xl active:shadow-xl ${stat.glow}
                            transition-all duration-300 ease-in-out
                            hover:-translate-y-1 active:-translate-y-1
                            hover:border-transparent active:border-transparent
                            overflow-hidden cursor-pointer h-full
                        `}>
                            {/* Top gradient accent bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.accent}
                                transform scale-x-0 group-hover:scale-x-100 group-active:scale-x-100
                                transition-transform duration-300 origin-left rounded-t-2xl`}
                            />

                            {/* Background glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-0 group-hover:opacity-[0.04] group-active:opacity-[0.04] transition-opacity duration-300 rounded-2xl`} />

                            <div className="relative flex items-start justify-between gap-4">
                                {/* Icon */}
                                <div className={`
                                    p-3 rounded-xl ${stat.iconBg} ${stat.hoverIconBg}
                                    transition-all duration-300 flex-shrink-0
                                    group-hover:scale-110 group-hover:rotate-3
                                    group-active:scale-110 group-active:rotate-3
                                    shadow-sm
                                `}>
                                    {stat.icon}
                                </div>

                                {/* Arrow */}
                                <div className="opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 group-active:translate-x-0 mt-1">
                                    <div className={`p-1.5 rounded-full bg-gradient-to-r ${stat.accent}`}>
                                        <ArrowRight size={12} className="text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="relative mt-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                    {stat.label}
                                </p>
                                <p className="text-2xl font-black text-gray-800 mt-1 group-hover:text-gray-900 group-active:text-gray-900 transition-colors">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 font-medium group-hover:text-gray-500 group-active:text-gray-500 transition-colors">
                                    {stat.description}
                                </p>
                            </div>

                            {/* Bottom fill bar */}
                            <div className="relative mt-4 h-1 rounded-full bg-gray-100 overflow-hidden">
                                <div className={`h-full ${stat.bar} rounded-full w-0 group-hover:w-full group-active:w-full transition-all duration-500 ease-out`} />
                            </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
