'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, Mail, Lock, CheckSquare, ArrowLeft } from 'lucide-react'
import Footer from '@/components/layout/Footer'
import { toast } from '@/lib/toast'

/* ================= CAPTCHA GENERATOR ================= */
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function MortgageLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Captcha State
  const [captcha, setCaptcha] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /* 🔄 Generate captcha on page load */
  useEffect(() => {
    setCaptcha(generateCaptcha())
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (captchaInput.trim().toUpperCase() !== captcha) {
      setError('Invalid captcha')
      setCaptcha(generateCaptcha()) // regenerate
      setCaptchaInput('')
      return
    }

    setLoading(true)

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Invalid email or password. Please try again.')
        toast('Invalid email or password. Please try again.', 'error')
        setCaptcha(generateCaptcha())
        setCaptchaInput('')
        setLoading(false)
        return
      }

      // 2. Verify authorization against mortgage_users table via API endpoint
      const response = await fetch('/api/mortgage/auth/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok || !data.authorized) {
        // Sign out if not authorized in mortgage portal
        await supabase.auth.signOut()
        setError('Your account does not have access to this portal.')
        toast('Your account does not have access to this portal.', 'error')
        setCaptcha(generateCaptcha())
        setCaptchaInput('')
        setLoading(false)
        return
      }

      // 3. Ensure profile role compatibility
      if (authData.session) {
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, portal_access')
          .eq('id', authData.session.user.id)
          .single()

        if (profileError) {
          const fallback = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.session.user.id)
            .single()
          const isMortgage = fallback.data?.role === 'mortgage' || fallback.data?.role === 'admin'
          profile = { ...fallback.data, portal_access: isMortgage ? ['mortgage'] : ['insurance'] }
        }

        const hasMortgageAccess = profile?.portal_access?.includes('mortgage') || profile?.role === 'mortgage' || profile?.role === 'superadmin' || profile?.role === 'admin' || email.toLowerCase().includes('moonstar.com')

        if (!hasMortgageAccess) {
          await supabase.auth.signOut()
          setError('Your account does not have access to this portal.')
          toast('Your account does not have access to this portal.', 'error')
          setCaptcha(generateCaptcha())
          setCaptchaInput('')
          setLoading(false)
          return
        }
      }

      // Store local authentication state
      if (typeof window !== 'undefined') {
        localStorage.setItem('moonstar_mortgage_authenticated', 'true')
        localStorage.setItem('moonstar_mortgage_user_email', email)
      }

      toast(`Welcome to Moonstar Mortgage! Redirecting...`, 'success', 3000)
      router.push('/mortgage')
    } catch (err: any) {
      console.error('Login exception:', err)
      setError('Invalid email or password. Please try again.')
      toast('Invalid email or password. Please try again.', 'error')
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
    } finally {
      setLoading(false)
    }
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
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#0F172A] to-[#0F766E] lg:hidden -z-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 md:w-96 h-full bg-white/5 skew-x-12 translate-x-32 rounded-l-3xl backdrop-blur-sm pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-3xl" />
        </div>
      </div>
      
      {/* Desktop-only background color wrapper */}
      <div className="absolute inset-0 bg-slate-50 hidden lg:block -z-20"></div>

      <div className="flex-1 flex flex-col lg:flex-row w-full z-10">

        {/* LEFT SIDE (40%) - Branding (Desktop Only) */}
        <div className="hidden lg:flex w-full lg:w-[40%] bg-gradient-to-br from-[#1E3A8A] via-[#0F172A] to-[#0F766E] relative overflow-hidden flex-col justify-center px-12 lg:px-16 text-white shrink-0 shadow-lg lg:shadow-2xl z-10">
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
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-600/30 rounded-full blur-3xl"></div>
          <div className="absolute top-10 left-1/2 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-20 max-w-xl mx-auto lg:mx-0 w-full text-left">
            <div className="bg-white/95 p-3 rounded-2xl inline-block mb-6 shadow-md">
              <img
                src="/Moonstarlogo-removebg-preview.png"
                alt="Moonstar Mortgage Logo"
                className="h-16 lg:h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-sm text-white">MOONSTAR MORTGAGE</h1>
            <h2 className="text-xl font-medium text-blue-200 mb-6 tracking-wide uppercase">Dedicated Lending Portal</h2>
            <div className="w-16 h-1 bg-amber-500 rounded-full mb-8"></div>
            <p className="text-base lg:text-lg text-slate-300 max-w-md leading-relaxed drop-shadow-sm">
              Streamlining residential and commercial mortgage origination with precision underwriting, fast pre-approvals, and comprehensive pipeline visibility.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE (60%) - Login Form */}
        <div className="w-full lg:w-[60%] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative flex-1">
          {/* Decorative background blurs for right side */}
          <div className="hidden lg:block absolute top-10 right-10 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -z-10"></div>
          <div className="hidden lg:block absolute bottom-10 left-10 w-64 h-64 bg-teal-100/40 rounded-full blur-3xl -z-10"></div>

          {/* MOBILE BRANDING (Visible only on mobile, centered above the card) */}
          <div className="lg:hidden flex flex-col items-center justify-center text-white mb-6 sm:mb-8 text-center drop-shadow-md z-10 w-full mt-10 sm:mt-12">
             <div className="bg-white/95 p-2 rounded-xl inline-block mb-3 shadow-md">
               <img
                 src="/Moonstarlogo-removebg-preview.png"
                 alt="Moonstar Mortgage Logo"
                 className="h-12 sm:h-14 w-auto object-contain"
               />
             </div>
             <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1">MOONSTAR MORTGAGE</h1>
             <h2 className="text-sm sm:text-base font-medium text-blue-200 uppercase tracking-wider">Lending Portal</h2>
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
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="mortgageadmin@moonstar.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 transition-all duration-300 text-sm shadow-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 block ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 transition-all duration-300 text-sm shadow-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <div
                  className="w-full sm:w-32 h-12 bg-gray-100/80 flex items-center justify-center font-bold tracking-[0.25em] rounded-xl border border-gray-200 text-gray-700 select-none pointer-events-none text-lg shadow-inner shrink-0"
                  onCopy={e => e.preventDefault()}
                >
                  {captcha}
                </div>
                <input
                  type="text"
                  placeholder="Enter Captcha"
                  className="flex-1 px-4 py-3 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 transition-all duration-300 text-sm uppercase shadow-sm text-center sm:text-left font-medium"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
                />
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
                                    ${rememberMe ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-300 bg-gray-50/50 text-transparent group-hover:border-blue-400'}
                                `}>
                      <CheckSquare size={12} className={rememberMe ? 'block scale-100' : 'hidden scale-0 transition-transform'} />
                    </div>
                  </div>
                  <span className="text-gray-600 font-medium group-hover:text-gray-800 transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline underline-offset-2">
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
                className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#0F766E] hover:from-[#1E40AF] hover:to-[#0D9488] text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(30,58,138,0.39)] hover:shadow-[0_6px_20px_rgba(30,58,138,0.23)] hover:-translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
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
