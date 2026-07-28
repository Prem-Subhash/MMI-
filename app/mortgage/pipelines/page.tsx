import { supabaseServer as supabase } from '@/lib/supabaseServer'
import { getCurrentUser, getUserRole } from '@/utils/auth'
import MortgagePipelineClient from './MortgagePipelineClient'

export default async function MortgagePipelinesPage({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
    const user = await getCurrentUser()
    const role = user ? await getUserRole(user.id) : null
    const isGlobal = isSuperAdmin || role === 'superadmin' || role === 'admin'

    let query = supabase
        .from('mortgage_loans')
        .select('*')
        .order('created_at', { ascending: false })

    if (!isGlobal && user) {
        query = query.eq('assigned_mortgage_officer', user.id)
    }

    const { data: loans, error } = await query

    if (error) {
        console.error("ERROR fetching mortgage loans for monitoring:", error)
    }

    return (
        <MortgagePipelineClient
            initialLoans={loans || []}
            isSuperAdmin={isGlobal}
        />
    )
}
