'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, Mail, Lock, CheckSquare } from 'lucide-react'
import Footer from '@/components/layout/Footer'

/* ================= CAPTCHA GENERATOR ================= */
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function LoginPage() {
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-250px)]">
        
        {/* LEFT SIDE (40%) - Branding */}
        <div className="hidden lg:flex w-full lg:w-[40%] bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden flex-col justify-center px-12 text-white">
            {/* Geometric Shape */}
            <div className="absolute top-0 right-0 w-32 h-full bg-white/10 skew-x-12 translate-x-16 rounded-l-3xl backdrop-blur-sm"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <h1 className="text-6xl font-extrabold tracking-tight mb-2">MOONSTAR</h1>
                <h2 className="text-2xl font-medium text-emerald-50 mb-6">Mortgage</h2>
                <div className="w-16 h-1 bg-emerald-300 rounded-full mb-8"></div>
                <p className="text-lg text-emerald-100 max-w-md leading-relaxed">
                    Streamline your workflow, manage client relationships effectively, and close more deals with our integrated dashboard solution.
                </p>
            </div>
        </div>

        {/* RIGHT SIDE (60%) - Login Form */}
        <div className="w-full lg:w-[60%] bg-gray-50 flex items-center justify-center p-4 lg:p-8">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Sign In </h2>
                    <p className="text-gray-500 mt-2">Enter your credentials to access your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 block">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 block">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* CAPTCHA - Restored Logic */}
                    <div className="flex gap-3">
                        <div 
                            className="w-32 h-11 bg-gray-100 flex items-center justify-center font-bold tracking-[0.2em] rounded-lg border border-gray-200 text-gray-700 select-none pointer-events-none text-lg"
                            onCopy={e => e.preventDefault()}
                        >
                            {captcha}
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Captcha"
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm uppercase"
                            value={captchaInput}
                            onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
                        />
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between text-sm pt-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                             <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="peer sr-only"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                />
                                <div className={`w-4 h-4 border rounded transition-colors flex items-center justify-center 
                                    ${rememberMe ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 bg-white text-transparent'}
                                `}>
                                    <CheckSquare size={12} className={rememberMe ? 'block' : 'hidden'} />
                                </div>
                             </div>
                             <span className="text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
                        </label>
                        <button type="button" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                            Forgot password?
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0FA885] hover:bg-[#0c8a6d] text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                    >
                        {loading ? 'Logging in...' : 'Submit'}
                    </button>
                </form>


            </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
