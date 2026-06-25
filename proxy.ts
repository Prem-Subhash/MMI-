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

    if (pathname.startsWith('/login') || pathname.startsWith('/unauthorized')) {
        return response
    }

    // Role Route Protections
    const protectedRoutes = ['/csr', '/admin', '/accounting', '/superadmin', '/dashboard']
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

    if (isProtectedRoute) {
        if (!user) {
            console.log(`[MIDDLEWARE] Redirecting to /login - No user found`)
            const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
            // Copy cookies from our refreshed response object to the redirect response
            response.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
            })
            return redirectResponse
        }

        // Fetch profile with Case-Insensitive fallback
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role?.toLowerCase()

        if (!role) {
            console.warn(`[MIDDLEWARE] No role found for user ${user.email} (${user.id})`)
            const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
            response.cookies.getAll().forEach(cookie => {
                redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
            })
            return redirectResponse
        }

        const accessMatrix: Record<string, string[]> = {
            csr: ['/csr'],
            admin: ['/admin', '/csr'],
            accounting: ['/accounting'],
            superadmin: ['/superadmin', '/admin', '/csr', '/accounting']
        }

        const validPaths = accessMatrix[role] || []
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
