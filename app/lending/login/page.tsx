'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, Mail, Lock, CheckSquare, ArrowLeft } from 'lucide-react'
import Footer from '@/components/layout/Footer'
import { toast } from '@/lib/toast'

export default function LendingLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError('Invalid email or password. Please try again.')
      toast('Invalid email or password. Please try again.', 'error')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, portal_access')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        // Defensive fallback if portal_access column has not been migrated yet
        const fallback = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        const isLending = fallback.data?.role === 'lending' || fallback.data?.role === 'accurate_lending'
        profile = { ...fallback.data, portal_access: isLending ? ['lending'] : ['insurance'] }
      }

      const hasLendingAccess = profile?.portal_access?.includes('lending') || profile?.portal_access?.includes('accurate_lending') || profile?.role === 'lending' || profile?.role === 'accurate_lending' || profile?.role === 'superadmin'

      if (hasLendingAccess) {
        toast(`Welcome to Accurate Lending! Redirecting to dashboard...`, 'success', 3000)
        router.push('/lending/dashboard')
        return
      } else {
        await supabase.auth.signOut()
        setError('Your account does not have access to this portal.')
        toast('Your account does not have access to this portal.', 'error')
        return
      }
    }

    await supabase.auth.signOut()
    setError('Invalid email or password. Please try again.')
    toast('Invalid email or password. Please try again.', 'error')
    return
  }

  return (
    <div className="min-h-dvh flex flex-col font-sans pb-safe relative overflow-hidden lg:overflow-visible">
      {/* Mobile Back to Home Link */}
      <button
        type="button"
        onClick={() => router.push('/')}
        title="Back to Home"
        aria-label="Back to Home"
        className="lg:hidden absolute top-5 left-5 z-30 p-3 rounded-full bg-slate-900/40 hover:bg-slate-900/60 border border-white/20 hover:border-white/40 text-white transition-all duration-300 backdrop-blur-md shadow-sm hover:shadow group flex items-center justify-center"
      >
        <ArrowLeft size={20} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
      </button>
      
      {/* Mobile-only background gradient wrapper */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#991B1B] via-[#7F1D1D] to-[#111827] lg:hidden -z-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 md:w-96 h-full bg-white/5 skew-x-12 translate-x-32 rounded-l-3xl backdrop-blur-sm pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#DC2626]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[40rem] h-[40rem] bg-[#111827]/30 rounded-full blur-3xl" />
        </div>
      </div>
      
      {/* Desktop-only background color wrapper */}
      <div className="absolute inset-0 bg-slate-50 hidden lg:block -z-20"></div>

      <div className="flex-1 flex flex-col lg:flex-row w-full z-10">

        {/* LEFT SIDE (40%) - Branding (Desktop Only) */}
        <div className="hidden lg:flex w-full lg:w-[40%] bg-gradient-to-br from-[#991B1B] via-[#7F1D1D] to-[#111827] relative overflow-hidden flex-col justify-center px-12 lg:px-16 text-white shrink-0 shadow-lg lg:shadow-2xl z-10">
          {/* Back to Home Link */}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="absolute top-8 left-12 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 hover:border-white/50 text-white text-sm font-medium transition-all duration-300 backdrop-blur-md shadow-sm hover:shadow group"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
            <span>Back to Home</span>
          </button>
          {/* Geometric Shapes */}
          <div className="absolute top-0 right-0 w-48 h-full bg-white/5 skew-x-12 translate-x-24 rounded-l-3xl backdrop-blur-sm"></div>
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#DC2626]/30 rounded-full blur-3xl"></div>
          <div className="absolute top-10 left-1/2 w-32 h-32 bg-[#111827]/40 rounded-full blur-2xl"></div>

          <div className="relative z-20 max-w-xl mx-auto lg:mx-0 w-full text-left">
            <div className="bg-white/95 p-3 rounded-2xl inline-block mb-6 shadow-md border border-[#DC2626]/30">
              <img
                src="/Accurate_Lending_Logo-removebg-preview.png"
                alt="Accurate Lending Logo"
                className="h-16 lg:h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-sm text-white">ACCURATE LENDING</h1>
            <h2 className="text-xl font-semibold text-[#FECACA] mb-6 tracking-wide uppercase">Commercial Lending Portal</h2>
            <div className="w-16 h-1.5 bg-[#DC2626] rounded-full mb-8 shadow-[0_0_12px_rgba(220,38,38,0.5)]"></div>
            <p className="text-base lg:text-lg text-red-100 max-w-md leading-relaxed drop-shadow-sm">
              Empowering businesses with streamlined commercial financing, transparent underwriting, and rapid capital deployment.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE (60%) - Login Form */}
        <div className="w-full lg:w-[60%] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative flex-1">
          {/* Decorative background blurs for right side */}
          <div className="hidden lg:block absolute top-10 right-10 w-64 h-64 bg-[#DC2626]/10 rounded-full blur-3xl -z-10"></div>
          <div className="hidden lg:block absolute bottom-10 left-10 w-64 h-64 bg-[#111827]/10 rounded-full blur-3xl -z-10"></div>

          {/* MOBILE BRANDING (Visible only on mobile, centered above the card) */}
          <div className="lg:hidden flex flex-col items-center justify-center text-white mb-6 sm:mb-8 text-center drop-shadow-md z-10 w-full mt-10 sm:mt-12">
             <div className="bg-white/95 p-2 rounded-xl inline-block mb-3 shadow-md border border-[#DC2626]/30">
               <img
                 src="/Accurate_Lending_Logo-removebg-preview.png"
                 alt="Accurate Lending Logo"
                 className="h-12 sm:h-14 w-auto object-contain"
               />
             </div>
             <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1">ACCURATE LENDING</h1>
             <h2 className="text-sm sm:text-base font-semibold text-[#FECACA] uppercase tracking-wider">Commercial Portal</h2>
          </div>

          <div className="w-full max-w-md bg-white/95 lg:bg-white/80 backdrop-blur-2xl lg:backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)] lg:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/40 lg:border-white/60 p-6 sm:p-8 lg:p-10 relative z-10 transition-all duration-300 lg:hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
            <div className="text-center mb-6 lg:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 lg:text-gray-800 tracking-tight">Portal Sign In</h2>
              <p className="text-sm sm:text-base text-gray-600 lg:text-gray-500 mt-1.5 font-medium">Enter your authorized credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 block ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#DC2626] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="name@accuratelending.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DC2626]/50 focus:border-[#991B1B] transition-all duration-300 text-sm shadow-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 block ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#DC2626] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DC2626]/50 focus:border-[#991B1B] transition-all duration-300 text-sm shadow-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#DC2626] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm pt-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    <div className={`w-4 h-4 border rounded transition-all duration-200 flex items-center justify-center 
                                    ${rememberMe ? 'bg-[#991B1B] border-[#991B1B] text-white shadow-sm' : 'border-gray-300 bg-gray-50/50 text-transparent group-hover:border-[#DC2626]'}
                                `}>
                      <CheckSquare size={12} className={rememberMe ? 'block scale-100' : 'hidden scale-0 transition-transform'} />
                    </div>
                  </div>
                  <span className="text-gray-600 font-medium group-hover:text-gray-800 transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-[#991B1B] hover:text-[#DC2626] font-semibold transition-colors hover:underline underline-offset-2">
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 text-sm font-medium rounded-xl text-center animate-fade-in shadow-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#991B1B] hover:from-[#7F1D1D] hover:to-[#B91C1C] text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(153,27,27,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.35)] hover:-translate-y-[1px] border border-[#DC2626]/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying Access...
                  </span>
                ) : (
                  'Sign In to Portal'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="w-full shrink-0 z-10 relative">
        <Footer />
      </div>
    </div>
  )
}
