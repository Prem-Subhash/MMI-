import { createServer } from '@/lib/supabaseServer'

export type UserRole = 'csr' | 'admin' | 'accounting' | 'superadmin'

export async function getCurrentUser() {
    const supabase = await createServer()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
    const supabase = await createServer()
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    if (error || !data) return null
    return data.role as UserRole
}

export function getRedirectPath(role: UserRole | null): string {
    switch (role) {
        case 'csr': return '/csr'
        case 'admin': return '/admin'
        case 'accounting': return '/accounting'
        case 'superadmin': return '/superadmin'
        default: return '/unauthorized'
    }
}
