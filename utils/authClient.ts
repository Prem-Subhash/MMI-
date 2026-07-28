export type UserRole = 'csr' | 'admin' | 'accounting' | 'superadmin' | 'mortgage' | 'lending' | 'accurate_lending'
export type InsuranceCategory = 'personal' | 'commercial'

export function canAccessInsuranceCategory(
    profile: { role?: string | null; insurance_access?: string[] | null; [key: string]: any } | null | undefined,
    category?: 'personal' | 'commercial' | string | null
): boolean {
    if (!profile) return false

    const role = profile.role?.toLowerCase()
    // Mortgage and Lending modules are completely independent and do not have access to Insurance categories
    if (role === 'mortgage' || role === 'lending' || role === 'accurate_lending') {
        return false
    }

    // Admin, Super Admin, and Accounting have access across all insurance categories
    if (role !== 'csr') {
        return true
    }

    const access = Array.isArray(profile.insurance_access) ? profile.insurance_access : []

    if (!category || category === 'all') {
        return access.length > 0
    }

    const normalizedCategory = category.toLowerCase().trim()
    if (normalizedCategory === 'personal' || normalizedCategory === 'personal lines') {
        return access.includes('personal')
    }
    if (normalizedCategory === 'commercial' || normalizedCategory === 'commercial lines') {
        return access.includes('commercial')
    }

    return access.includes(normalizedCategory)
}

export function getRedirectPath(role: UserRole | null): string {
    switch (role) {
        case 'csr': return '/csr'
        case 'admin': return '/admin'
        case 'accounting': return '/accounting'
        case 'superadmin': return '/superadmin'
        case 'mortgage': return '/mortgage'
        case 'lending':
        case 'accurate_lending': return '/lending'
        default: return '/unauthorized'
    }
}
