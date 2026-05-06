import React from 'react'
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.href} className="group">
                        <div className="relative bg-white rounded-2xl border border-black p-4 shadow-sm hover:shadow-md transition-all h-full flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="text-gray-400">
                                    {React.cloneElement(stat.icon as React.ReactElement<{ size: number }>, { size: 14 })}
                                </div>
                                <p className="text-[12px] font-black uppercase tracking-wider leading-none">
                                    {stat.label}
                                </p>
                            </div>
                            <p className="text-[18px] font-black text-gray-900 leading-tight">
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
                    <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <p className="text-gray-400 text-sm">System Activity Feed will appear here.</p>
                </div>
            </div>
        </div>
    )
}
