'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LendingSidebar from '@/components/lending/layout/LendingSidebar'
import LendingTopBar from '@/components/lending/layout/LendingTopBar'
import Footer from '@/components/layout/Footer'

export default function LendingClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isLoginPage = pathname === '/lending/login' || pathname.startsWith('/lending/login')

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false)
      return
    }

    const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes of inactivity
    let timeoutId: any = null

    const handleLogout = async () => {
      await supabase.auth.signOut()
      router.replace('/lending/login')
    }

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.log('Lending user inactive. Logging out...')
        handleLogout()
      }, TIMEOUT_MS)
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/lending/login')
        return
      }

      // Perform RBAC validation for Accurate Lending portal access
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('role, portal_access')
        .eq('id', session.user.id)
        .single()

      if (error) {
        // Fallback if portal_access column migration has not run yet
        const fallback = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        const isLending = fallback.data?.role === 'lending' || fallback.data?.role === 'accurate_lending'
        profile = { ...fallback.data, portal_access: isLending ? ['lending'] : ['insurance'] }
      }

      const hasLendingAccess = profile?.portal_access?.includes('lending') || profile?.portal_access?.includes('accurate_lending') || profile?.role === 'lending' || profile?.role === 'accurate_lending' || profile?.role === 'superadmin'

      if (!hasLendingAccess) {
        console.warn(`[LENDING LAYOUT] Unauthorized access attempt by user ${session.user.id}`)
        router.replace('/unauthorized')
        return
      }

      setCheckingAuth(false)
      resetTimer()
    }

    // 1. Initial Session Check
    checkSession()

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/lending/login')
      }
    })

    // 3. Activity Tracking
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(name => document.addEventListener(name, resetTimer))

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
      events.forEach(name => document.removeEventListener(name, resetTimer))
    }
  }, [router, isLoginPage])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (checkingAuth) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-[#1E3A8A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-bold text-gray-600 animate-pulse">Verifying Accurate Lending Portal Access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-slate-100 pb-safe overflow-x-hidden">
      <LendingTopBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <LendingSidebar 
        isHovered={isSidebarHovered} 
        setIsHovered={setIsSidebarHovered} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Wrapper */}
      <div
        className={`
            flex-1 flex flex-col pt-16 lg:pt-24 transition-all duration-300 ease-in-out w-full min-w-0
            ${isSidebarHovered ? 'lg:pl-[260px]' : 'lg:pl-[110px]'}
            pl-0
        `}
      >
        <main className="flex-1 w-full flex flex-col overflow-x-hidden min-w-0">
          <div className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full min-w-0">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
