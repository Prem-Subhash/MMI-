'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import { supabase } from '@/lib/supabaseClient'

interface PortalCard {
  id: string
  title: string
  logo: string
  description: string
  targetUrl: string
}

const portalCards: PortalCard[] = [
  {
    id: 'insurance',
    title: 'Innovative Insurance',
    logo: '/innovative_logo_-removebg-preview.png',
    description: 'Access the Insurance CRM portal to manage Personal Lines, Commercial Lines, Renewals, and client relationships.',
    targetUrl: '/login',
  },
  {
    id: 'mortgage',
    title: 'Moonstar Mortgage',
    logo: '/Moonstarlogo-removebg-preview.png',
    description: 'Access the Mortgage CRM portal to manage loan applications, mortgage pipelines, and borrower workflows.',
    targetUrl: '#',
  },
  {
    id: 'lending',
    title: 'Accurate Lending',
    logo: '/Accurate_Lending_Logo-removebg-preview.png',
    description: 'Access the Commercial Lending CRM portal to manage lending pipelines, underwriting, and borrower communication.',
    targetUrl: '/lending/login',
  },
]

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
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
          profile = { ...fallback.data, portal_access: isLending ? ['lending'] : ['insurance'] }
        }
        
        const isLendingRole = profile?.role === 'lending' || profile?.role === 'accurate_lending'
        const hasLendingPortal = profile?.portal_access?.includes('lending') || profile?.portal_access?.includes('accurate_lending')
        const hasInsurancePortal = profile?.portal_access?.includes('insurance')

        if (hasLendingPortal && !hasInsurancePortal) {
          router.push('/lending/dashboard')
        } else if (isLendingRole) {
          router.push('/lending/dashboard')
        } else if (profile?.role) {
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
        alt="Mortgage Home"
        fill
        priority
        style={{ objectFit: 'cover', zIndex: -2 }}
      />

      {/* Overlay */}
      <div style={overlay} />

      {/* Content */}
      <section style={content}>
        <div className="max-w-3xl">
          <h1 style={heading} className='text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm'>Welcome,</h1>
          <h1 style={heading}>
            Your Key to a Brighter <br /> Future
          </h1>

          <p style={subheading}>
            Trusted mortgage solutions built on transparency,
            speed, and reliability.
          </p>
        </div>

        {/* Business Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full mt-12 mb-8">
          {portalCards.map((card) => (
            <div
              key={card.id}
              className="bg-white/95 hover:bg-white backdrop-blur-xl rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-white/40 shadow-[0_15px_35px_rgba(0,0,0,0.25)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-2 group text-gray-800"
            >
              <div>
                {/* Logo Box */}
                <div className="h-24 w-full flex items-center justify-center bg-gray-50/90 rounded-xl p-4 mb-6 border border-gray-100 group-hover:border-teal-500/30 transition-colors shadow-inner">
                  <img
                    src={card.logo}
                    alt={`${card.title} Logo`}
                    className="max-h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Card Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                  {card.title}
                </h3>

                {/* Card Description */}
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal mb-8">
                  {card.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (card.targetUrl && card.targetUrl !== '#') {
                    router.push(card.targetUrl)
                  }
                }}
                className="w-full bg-brand text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group-hover:brightness-105"
              >
                <span>Enter Portal</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          ))}
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
  backgroundColor: 'rgba(0,0,0,0.45)',
  zIndex: -1,
}

const content = {
  flex: 1,
  padding: '8vh 5%',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  color: '#fff',
  maxWidth: '1300px',
  width: '100%',
  margin: '0 auto',
  zIndex: 1,
}

const heading = {
  textShadow: '0 0 10px rgba(0,0,0,0.5)',
  fontSize: '56px',
  fontWeight: 700,
  marginTop: '30px',
  lineHeight: '1.1',
}

const subheading = {
  textShadow: '0 0 10px rgba(0,0,0,0.5)',
  fontSize: '18px',
  marginTop: '20px',
  maxWidth: '500px',
  opacity: 0.9,
}
