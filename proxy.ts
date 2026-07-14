import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    // 1. Standard Client for User Auth
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return request.cookies.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // 2. Admin Client for Power-Checks
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname
    
    if (user) {
        console.log(`[MIDDLEWARE] User Session Active: ${user.id} accessing ${pathname}`);
    } else {
        console.log(`[MIDDLEWARE] No User Session accessing ${pathname}`);
    }

    if (pathname.startsWith('/login') || pathname.startsWith('/lending/login') || pathname.startsWith('/mortgage/login') || pathname.startsWith('/unauthorized')) {
        return response
    }

    // Handle alias route /accurate_lending directly by redirecting to /lending/dashboard
    if (pathname.startsWith('/accurate_lending')) {
        const redirectResponse = NextResponse.redirect(new URL('/lending/dashboard', request.url))
        response.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
        })
        return redirectResponse
    }

    // Role Route Protections
    const protectedRoutes = ['/csr', '/admin', '/accounting', '/superadmin', '/dashboard', '/lending', '/accurate_lending', '/mortgage']
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

    if (isProtectedRoute) {
        if (!user) {
            console.log(`[MIDDLEWARE] Redirecting to login - No user found`)
            const loginUrl = (pathname.startsWith('/lending') || pathname.startsWith('/accurate_lending')) ? '/lending/login' : (pathname.startsWith('/mortgage') ? '/mortgage/login' : '/login')
            const redirectResponse = NextResponse.redirect(new URL(loginUrl, request.url))
            // Copy cookies from our refreshed response object to the redirect response
            response.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
            })
            return redirectResponse
        }

        // Fetch profile with Case-Insensitive fallback and portal_access
        let { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, portal_access')
            .eq('id', user.id)
            .single()

        if (profileError) {
            // Defensive fallback if portal_access column has not been migrated yet
            const fallback = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            const isLending = fallback.data?.role === 'lending' || fallback.data?.role === 'accurate_lending'
            const isMortgage = fallback.data?.role === 'mortgage'
            profile = { ...fallback.data, portal_access: isLending ? ['lending'] : (isMortgage ? ['mortgage'] : ['insurance']) }
        }

        const role = profile?.role?.toLowerCase()
        const isLendingRole = role === 'lending' || role === 'accurate_lending'
        const isMortgageRole = role === 'mortgage'
        const portalAccess: string[] = profile?.portal_access || (isLendingRole ? ['lending'] : (isMortgageRole ? ['mortgage'] : ['insurance']))

        if (!role && !portalAccess.includes('lending') && !portalAccess.includes('accurate_lending') && !portalAccess.includes('mortgage')) {
            console.warn(`[MIDDLEWARE] No role found for user ${user.email} (${user.id})`)
            const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
            response.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
            })
            return redirectResponse
        }

        // Special RBAC check for Accurate Lending routes
        if (pathname.startsWith('/lending') || pathname.startsWith('/accurate_lending')) {
            const hasLendingAccess = portalAccess.includes('lending') || portalAccess.includes('accurate_lending') || isLendingRole || role === 'superadmin'
            if (!hasLendingAccess) {
                console.warn(`[MIDDLEWARE] Unauthorized lending access attempt by user ${user.id} with role: ${role}`)
                const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
                response.cookies.getAll().forEach(cookie => {
                    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
                })
                return redirectResponse
            }
            return response
        }

        // Special RBAC check for Mortgage routes
        if (pathname.startsWith('/mortgage')) {
            const hasMortgageAccess = portalAccess.includes('mortgage') || isMortgageRole || role === 'superadmin' || role === 'admin' || user.email?.toLowerCase().includes('moonstar.com')
            if (!hasMortgageAccess) {
                console.warn(`[MIDDLEWARE] Unauthorized mortgage access attempt by user ${user.id} with role: ${role}`)
                const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
                response.cookies.getAll().forEach(cookie => {
                    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
                })
                return redirectResponse
            }
            return response
        }

        const accessMatrix: Record<string, string[]> = {
            csr: ['/csr'],
            admin: ['/admin', '/csr', '/mortgage'],
            accounting: ['/accounting'],
            superadmin: ['/superadmin', '/admin', '/csr', '/accounting', '/lending', '/mortgage'],
            lending: ['/lending'],
            accurate_lending: ['/lending'],
            mortgage: ['/mortgage']
        }

        const validPaths = accessMatrix[role || ''] || []
        const isAuthorized = validPaths.some((allowedRoute) => pathname.startsWith(allowedRoute))

        if (!isAuthorized) {
            console.warn(`[MIDDLEWARE] Unauthorized access for user ${user.id}. Role: ${role}, Path: ${pathname}`)
            const fallbackDashboard = validPaths[0] || '/unauthorized'
            const redirectResponse = NextResponse.redirect(new URL(fallbackDashboard, request.url))
            response.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
            })
            return redirectResponse
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|login\\/bg\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
