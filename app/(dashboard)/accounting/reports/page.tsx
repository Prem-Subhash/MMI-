import { createServer } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { FileBarChart } from 'lucide-react'

export default async function AccountingReports() {
    const supabase = await createServer()

    // Verify Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['accounting', 'superadmin'].includes(profile?.role)) {
        redirect('/unauthorized')
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Financial Reports</h1>
                    <p className="text-gray-600">Generate ad-hoc and standardized accounting reports.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                    <FileBarChart className="mx-auto text-indigo-200 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Report Generation System Offline</h3>
                    <p>Advanced filtering and export functions are being optimized for large datasets.</p>
                </div>
            </div>
        </div>
    )
}
