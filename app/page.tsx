'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabaseClient'
import { Shield, Home as HomeIcon, Building2, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (profile?.role) {
          router.push(`/${profile.role}`)
        }
      }
    }
    checkSession()
  }, [router])

  return (
    <main style={container}>
      {/* Background Image */}
      <Image
        src="/bglogin.jpg"
        alt="Moonstar Lending Portal"
        fill
        priority
        style={{ objectFit: 'cover', zIndex: -2 }}
      />

      {/* Overlay */}
      <div style={overlay} />

      {/* Content */}
      <section style={content}>
        <Image
          src="/logo.png"
          alt="Moonstar Financial Group"
          width={220}
          height={80}
        />

        <h1 style={heading}>
          Your Key to a Brighter <br /> Future
        </h1>

        <p style={subheading}>
          Select your dedicated enterprise product module to access your workspace.
        </p>

        {/* 3 Product Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 w-full max-w-4xl">
          
          {/* 1. Insurance CRM Card */}
          <div
            onClick={() => router.push('/login')}
            className="p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-blue-500 transition-all duration-300 cursor-pointer shadow-xl group flex flex-col justify-between backdrop-blur-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                Insurance CRM
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Personal & Commercial Lines agency management, lead pipelines, renewals & policy tracking.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-blue-400 pt-4 border-t border-slate-800">
              <span>Access Insurance Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Moonstar Mortgage CRM Card */}
          <div
            onClick={() => router.push('/mortgage/login')}
            className="p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500 transition-all duration-300 cursor-pointer shadow-xl group flex flex-col justify-between backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-bl-xl">
              New Module
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <HomeIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                Moonstar Mortgage
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Dedicated residential & pre-approval mortgage origination, milestone compliance & underwriting.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-emerald-400 pt-4 border-t border-slate-800">
              <span>Access Mortgage Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Accurate Lending Card */}
          <div
            onClick={() => router.push('/login')}
            className="p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-500 transition-all duration-300 cursor-pointer shadow-xl group flex flex-col justify-between backdrop-blur-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                Accurate Lending
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Commercial lending, bridging finance, and multi-family underwriting management portal.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-amber-400 pt-4 border-t border-slate-800">
              <span>Access Lending Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  )
}

/* Styles */
const container = {
  minHeight: '100dvh',
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  overflowX: 'hidden' as const,
}

const overlay = {
  position: 'absolute' as const,
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.65)',
  zIndex: -1,
}

const content = {
  flex: 1,
  padding: '8vh 5%',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  color: '#fff',
  zIndex: 1,
}

const heading = {
  textShadow: '0 0 10px rgba(0,0,0,0.5)',
  fontSize: '52px',
  fontWeight: 700,
  marginTop: '24px',
  lineHeight: '1.1',
}

const subheading = {
  textShadow: '0 0 10px rgba(0,0,0,0.5)',
  fontSize: '16px',
  marginTop: '16px',
  maxWidth: '560px',
  opacity: 0.9,
}
