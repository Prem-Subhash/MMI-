'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // ❌ NOT LOGGED IN → FORCE LOGIN
      if (!session) {
        router.replace('/login')
        return
      }

      // ✅ LOGGED IN
      setCheckingAuth(false)
    }

    checkSession()
  }, [router])

  // ⏳ Prevent UI flash while checking auth
  if (checkingAuth) return null

  return (
    <div className="flex min-h-screen bg-slate-100">
      <TopBar />
      <Sidebar isHovered={isSidebarHovered} setIsHovered={setIsSidebarHovered} />
      
      {/* Main Content Wrapper */}
      <div 
        className={`
            flex-1 flex flex-col pt-24 h-full transition-all duration-300 ease-in-out
            ${isSidebarHovered ? 'pl-[260px]' : 'pl-[110px]'}
        `}
      >
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
