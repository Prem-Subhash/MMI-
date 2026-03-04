import { createServer } from '@/lib/supabaseServer'
import Link from 'next/link'

export default async function AdminLeadsPage() {
    const supabase = await createServer()

    // Fetch all leads (Admin has access to everything)
    const { data: leads, error } = await supabase
        .from('temp_leads_basics')
        .select(`
      id,
      client_name,
      email,
      phone,
      policy_type,
      assigned_csr,
      created_at,
      profiles:assigned_csr ( full_name )
    `)
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">All Leads</h1>
                    <p className="text-gray-600">View and monitor all leads across the CRM.</p>
                </div>
                <Link href="/admin">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                        Back to Dashboard
                    </button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-600 text-sm">Client Name</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Email</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Policy Type</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Assigned CSR</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(leads || []).map((lead: any) => (
                            <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4 text-gray-800 font-medium">{lead.client_name}</td>
                                <td className="p-4 text-gray-600 text-sm">{lead.email}</td>
                                <td className="p-4 text-gray-600 text-sm capitalize">{lead.policy_type}</td>
                                <td className="p-4 text-gray-600 text-sm">
                                    {lead.profiles?.full_name || <span className="text-amber-600 font-medium">Unassigned</span>}
                                </td>
                                <td className="p-4 text-gray-500 text-sm">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {(!leads || leads.length === 0) && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No leads found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
