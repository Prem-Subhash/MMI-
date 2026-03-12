import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import { Users, FileText, BarChart2, Briefcase, DollarSign, Activity, Settings } from 'lucide-react'

export default async function SuperAdminDashboard() {
    const supabase = await createServer()

    // 1. Total Users
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // 2. Total Leads
    const { count: totalLeads } = await supabase
        .from('temp_leads_basics')
        .select('*', { count: 'exact', head: true })

    // 3. Active Pipelines
    const { count: activePipelines } = await supabase
        .from('pipelines')
        .select('*', { count: 'exact', head: true })

    // 4. Total Bound Premium & 5. Total Quotes Sent
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

    let totalBoundPremium = 0;
    let totalQuotesSent = 0;

    leads?.forEach(lead => {
        // @ts-ignore
        const stageName = lead.current_stage?.stage_name || '';

        // Calculate Bound Premium
        if (stageName.includes('Completed') || stageName.includes('Bound')) {
            const meta = lead.stage_metadata as any;
            if (meta?.bound_premium) {
                totalBoundPremium += Number(meta.bound_premium) || 0;
            } else if (lead.total_premium) {
                totalBoundPremium += Number(lead.total_premium) || 0;
            }
        }

        // Calculate Quotes Sent
        if (stageName.includes('Quote') || stageName.includes('Quoted')) {
            totalQuotesSent++;
        }
    })

    const stats = [
        { label: 'Total Users', value: totalUsers || 0, icon: <Users size={24} />, href: '/superadmin/users' },
        { label: 'Total Leads', value: totalLeads || 0, icon: <FileText size={24} />, href: '/admin/leads' },
        { label: 'Active Pipelines', value: activePipelines || 0, icon: <Briefcase size={24} />, href: '/superadmin/pipelines' },
        { label: 'Total Bound Premium', value: `$${totalBoundPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <DollarSign size={24} />, href: '/accounting' },
        { label: 'Quotes Sent', value: totalQuotesSent, icon: <BarChart2 size={24} />, href: '/admin/pipelines' },
    ]

    const quickLinks = [
        { label: 'System Settings', href: '/superadmin/system-settings', icon: <Settings size={20} /> },
        { label: 'View Audit Logs', href: '/superadmin/audit-logs', icon: <Activity size={20} /> },
        { label: 'Email Templates', href: '/superadmin/email-templates', icon: <FileText size={20} /> },
        { label: 'Form Builder', href: '/superadmin/forms', icon: <ListTodo size={20} /> },
    ]

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 tracking-tight">Super Admin Dashboard</h1>
            <p className="text-gray-600 mb-8 max-w-2xl">Comprehensive overview of system metrics, users, and global configurations.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-12">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.href}>
                        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center gap-4 group h-full">
                            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {quickLinks.map((link, i) => (
                    <Link key={i} href={link.href}>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center gap-3 text-gray-700 hover:text-indigo-700 font-medium cursor-pointer">
                            {link.icon}
                            {link.label}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

function ListTodo(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="5" width="6" height="6" rx="1" />
            <path d="m3 17 2 2 4-4" />
            <path d="M13 6h8" />
            <path d="M13 12h8" />
            <path d="M13 18h8" />
        </svg>
    )
}
