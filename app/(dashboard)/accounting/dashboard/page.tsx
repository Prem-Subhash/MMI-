import { createServer } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { DollarSign, FileText, TrendingUp, Users } from 'lucide-react'

export default async function AccountingDashboard() {
    const supabase = await createServer()

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['accounting', 'superadmin'].includes(profile?.role)) {
        redirect('/unauthorized')
    }

    // Get basic stats
    const { count: totalLeads } = await supabase.from('temp_leads_basics').select('*', { count: 'exact', head: true })
    const { count: activePolicies } = await supabase.from('temp_leads_basics').select('*', { count: 'exact', head: true }).eq('status', 'Bound')

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Accounting Dashboard</h1>
                    <p className="text-gray-600">Overview of financial metrics and recent transactions.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Premium" value="$1.2M" icon={<DollarSign size={24} className="text-emerald-600" />} color="bg-emerald-50" />
                <MetricCard title="Active Policies" value={activePolicies?.toString() || '0'} icon={<FileText size={24} className="text-blue-600" />} color="bg-blue-50" />
                <MetricCard title="Revenue Growth" value="+15%" icon={<TrendingUp size={24} className="text-purple-600" />} color="bg-purple-50" />
                <MetricCard title="Total Accounts" value={totalLeads?.toString() || '0'} icon={<Users size={24} className="text-amber-600" />} color="bg-amber-50" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                <Activity className="mx-auto text-indigo-200 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Detailed Financials Coming Soon</h3>
                <p>The core accounting module is currently being integrated with the billing system.</p>
            </div>
        </div>
    </div>
    )
}

function MetricCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    )
}

function Activity(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
}
