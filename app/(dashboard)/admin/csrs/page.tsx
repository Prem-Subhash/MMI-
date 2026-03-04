import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'

export default async function AdminCSRsPage() {
    const supabase = await createServer()

    // Fetch CSR profiles
    const { data: csrs } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('role', 'csr')
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">CSR Management</h1>
                    <p className="text-gray-600">View all Customer Success Representatives in the system.</p>
                </div>
                <Link href="/admin">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                        Back
                    </button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-600 text-sm">CSR Name</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Email Address</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Joined Date</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(csrs || []).map((csr: any) => (
                            <tr key={csr.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4 text-gray-800 font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                            {csr.full_name?.charAt(0) || 'U'}
                                        </div>
                                        {csr.full_name || 'Unknown User'}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 text-sm">{csr.email}</td>
                                <td className="p-4 text-gray-500 text-sm">
                                    {new Date(csr.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition">
                                        View Workload
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!csrs || csrs.length === 0) && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No CSRs found in the system.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
