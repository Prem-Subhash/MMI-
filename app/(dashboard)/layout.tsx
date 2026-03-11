'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import Footer from '@/components/layout/Footer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      setCheckingAuth(false)
    }

    checkSession()
  }, [router])

  if (checkingAuth) return null

  return (
    <div className="flex min-h-screen bg-slate-100 overflow-x-hidden">
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

      {/* Main Content Wrapper */}
      <div
        className={`
            flex-1 flex flex-col pt-24 transition-all duration-300 ease-in-out w-full
            ${isSidebarHovered ? 'lg:pl-[260px]' : 'lg:pl-[110px]'}
            pl-0
        `}
      >
        <main className="flex-1 w-full flex flex-col max-w-[100vw]">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
