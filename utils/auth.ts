import { createServer, supabaseServer } from '@/lib/supabaseServer'
import { User } from '@supabase/supabase-js'

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

export async function authenticateApiRequest(req: Request, allowedRoles?: UserRole[], requireAuth: boolean = true): Promise<{
    user?: User | null;
    profile?: { role: UserRole, [key: string]: any } | null;
    error?: string;
    status?: number;
}> {
    let user;

    // 1. Try Token-Based Auth (e.g., Postman / API clients)
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const { data } = await supabaseServer.auth.getUser(token)
        user = data?.user
    }

    // 2. Fallback to Cookie-Based Auth (Web Application)
    if (!user) {
        const supabase = await createServer()
        const { data } = await supabase.auth.getUser()
        user = data?.user
    }

    if (!user) {
        if (requireAuth) {
            return { error: 'Unauthorized', status: 401 }
        }
        return { user: null, profile: null }
    }

    let profile = null;
    if (allowedRoles && allowedRoles.length > 0) {
        const { data: userProfile } = await supabaseServer
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (!userProfile || !allowedRoles.includes(userProfile.role)) {
            return { error: 'Forbidden', status: 403 }
        }
        profile = userProfile;
    }

    return { user, profile }
}
