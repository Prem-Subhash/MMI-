'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import Footer from '@/components/layout/Footer'

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes of inactivity
    let timeoutId: any = null

    const handleLogout = async () => {
      await supabase.auth.signOut()
      router.replace('/login')
    }

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.log('User inactive. Logging out...')
        handleLogout()
      }, TIMEOUT_MS)
    }

    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          if (sessionError && (sessionError.message?.includes('Refresh Token') || sessionError.code === 'refresh_token_not_found')) {
            await supabase.auth.signOut().catch(() => {})
          }
          router.replace('/login')
          return
        }

        // Perform RBAC validation for Insurance portal access
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('role, portal_access')
          .eq('id', session.user.id)
          .single()

        if (error) {
          const fallback = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          const isLending = fallback.data?.role === 'lending' || fallback.data?.role === 'accurate_lending'
          const isMortgage = fallback.data?.role === 'mortgage' || fallback.data?.role === 'admin'
          profile = { ...fallback.data, portal_access: isLending ? ['lending'] : (isMortgage ? ['mortgage'] : ['insurance']) }
        }

        const hasInsuranceAccess = profile?.portal_access?.includes('insurance') || profile?.role === 'superadmin'

        if (!hasInsuranceAccess) {
          console.warn(`[DASHBOARD LAYOUT] Unauthorized access attempt by user ${session.user.id}`)
          router.replace('/unauthorized')
          return
        }

        setCheckingAuth(false)
      resetTimer()
    }

    // 1. Initial Session Check
    checkSession()

    // 2. Listen for Auth Changes (e.g. logging out in another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AUTH STATE CHANGE] Event: ${event}, Session: ${session ? session.user.id : 'null'}`)
      if (event === 'SIGNED_OUT') {
        router.replace('/login')
      }
    })

    // 3. User Activity Tracking
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(name => document.addEventListener(name, resetTimer))

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
      events.forEach(name => document.removeEventListener(name, resetTimer))
    }
  }, [router])

  if (checkingAuth) return null

  return (
    <div className="flex min-h-dvh bg-slate-100 pb-safe overflow-x-hidden">
      <TopBar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        isHovered={isSidebarHovered} 
        setIsHovered={setIsSidebarHovered} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Wrapper — offset matches TopBar height (h-16 mobile / h-24 desktop) */}
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
