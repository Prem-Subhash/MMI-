import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'
import { Users, FileText, BarChart2, Briefcase, ListTodo } from 'lucide-react'

export default async function AdminDashboard() {
    const supabase = await createServer()

    // Basic Sample Queries for Admin Stats
    const { count: totalLeads } = await supabase
        .from('temp_leads_basics')
        .select('*', { count: 'exact', head: true })

    const { count: totalCsrs } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'csr')

    const stats = [
        { label: 'Total Leads', value: totalLeads || 0, icon: <FileText size={24} />, href: '/admin/leads' },
        { label: 'Total CSRs', value: totalCsrs || 0, icon: <Users size={24} />, href: '/admin/csrs' },
        { label: 'Assignments', value: 'Manage', icon: <ListTodo size={24} />, href: '/admin/assignments' },
        { label: 'Pipelines', value: 'View', icon: <Briefcase size={24} />, href: '/admin/pipelines' },
        { label: 'Reports', value: 'Generate', icon: <BarChart2 size={24} />, href: '/admin/reports' },
    ]

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 mb-8 max-w-2xl">Manage pipelines, review CSR performance, and assign incoming leads.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.href}>
                        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer flex items-center gap-6 group">
                            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Sample Activity Feed Placeholder */}
            <h2 className="text-xl font-semibold text-gray-800 mt-12 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow border p-8 text-center text-gray-500">
                System Activity Feed will appear here.
            </div>
        </div>
    )
}
