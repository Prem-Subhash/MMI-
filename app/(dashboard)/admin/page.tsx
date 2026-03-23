import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import {
    Users, FileText, BarChart2, Briefcase,
    ListTodo, ArrowRight, Activity
} from 'lucide-react'

export default async function AdminDashboard() {
    const supabase = await createServer()

    const { count: totalLeads } = await supabase
        .from('temp_leads_basics')
        .select('*', { count: 'exact', head: true })

    const { count: totalCsrs } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'csr')

    const stats = [
        {
            label: 'Total Leads',
            value: totalLeads || 0,
            icon: <FileText size={22} />,
            href: '/admin/leads',
            description: 'All leads across pipelines',
            accent: 'from-[#10B889] to-[#0d9470]',
            glow: 'shadow-emerald-200/60',
            iconBg: 'bg-emerald-50 text-emerald-600',
            hoverIconBg: 'group-hover:bg-[#10B889] group-hover:text-white',
            bar: 'bg-[#10B889]',
        },
        {
            label: 'Total CSRs',
            value: totalCsrs || 0,
            icon: <Users size={22} />,
            href: '/admin/csrs',
            description: 'Registered representatives',
            accent: 'from-[#2E5C85] to-[#1e3f5e]',
            glow: 'shadow-blue-200/60',
            iconBg: 'bg-blue-50 text-blue-600',
            hoverIconBg: 'group-hover:bg-[#2E5C85] group-hover:text-white',
            bar: 'bg-[#2E5C85]',
        },
        {
            label: 'Assignments',
            value: 'Manage',
            icon: <ListTodo size={22} />,
            href: '/admin/assignments',
            description: 'Route leads to CSRs',
            accent: 'from-amber-500 to-orange-500',
            glow: 'shadow-amber-200/60',
            iconBg: 'bg-amber-50 text-amber-600',
            hoverIconBg: 'group-hover:bg-amber-500 group-hover:text-white',
            bar: 'bg-amber-500',
        },
        {
            label: 'Pipelines',
            value: 'View',
            icon: <Briefcase size={22} />,
            href: '/admin/pipelines',
            description: 'Monitor stage progression',
            accent: 'from-purple-600 to-indigo-600',
            glow: 'shadow-purple-200/60',
            iconBg: 'bg-purple-50 text-purple-600',
            hoverIconBg: 'group-hover:bg-purple-600 group-hover:text-white',
            bar: 'bg-purple-600',
        },
        {
            label: 'Reports',
            value: 'Generate',
            icon: <BarChart2 size={22} />,
            href: '/admin/reports',
            description: 'Analytics & export tools',
            accent: 'from-rose-500 to-pink-600',
            glow: 'shadow-rose-200/60',
            iconBg: 'bg-rose-50 text-rose-500',
            hoverIconBg: 'group-hover:bg-rose-500 group-hover:text-white',
            bar: 'bg-rose-500',
        },
    ]

    return (
        <div className="p-4 sm:p-6 lg:p-8">

            {/* ── Header ── */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                    Admin Dashboard
                </h1>
                <p className="text-gray-500 mt-1 text-sm max-w-2xl">
                    Manage pipelines, review CSR performance, and assign incoming leads.
                </p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.href} className="group">
                        <div className={`
                            relative bg-white rounded-2xl border border-gray-100 p-6
                            shadow-md hover:shadow-xl active:shadow-xl ${stat.glow}
                            transition-all duration-300 ease-in-out
                            hover:-translate-y-1 active:-translate-y-1
                            hover:border-transparent active:border-transparent
                            overflow-hidden cursor-pointer
                        `}>
                            {/* Top gradient accent bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.accent}
                                transform scale-x-0 group-hover:scale-x-100 group-active:scale-x-100 transition-transform duration-300 origin-left rounded-t-2xl`}
                            />

                            {/* Decorative background glow on hover/tap */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-0 group-hover:opacity-[0.04] group-active:opacity-[0.04] transition-opacity duration-300 rounded-2xl`} />

                            <div className="relative flex items-start justify-between gap-4">
                                {/* Icon */}
                                <div className={`
                                    p-3 rounded-xl ${stat.iconBg} ${stat.hoverIconBg}
                                    group-active:scale-110 group-active:rotate-3
                                    transition-all duration-300 flex-shrink-0
                                    group-hover:scale-110 group-hover:rotate-3
                                    shadow-sm
                                `}>
                                    {stat.icon}
                                </div>

                                {/* Arrow — slides in on hover/tap */}
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

                            {/* Bottom accent bar */}
                            <div className="relative mt-4 h-1 rounded-full bg-gray-100 overflow-hidden">
                                <div className={`h-full ${stat.bar} rounded-full w-0 group-hover:w-full group-active:w-full transition-all duration-500 ease-out`} />
                            </div>
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
                    <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <p className="text-gray-400 text-sm">System Activity Feed will appear here.</p>
                </div>
            </div>
        </div>
    )
}
