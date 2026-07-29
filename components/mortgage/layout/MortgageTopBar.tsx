'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, ChevronRight, Menu } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/lib/toast'

export default function MortgageTopBar({ onMenuClick }: { onMenuClick: () => void }) {
    const router = useRouter()
    const [profileOpen, setProfileOpen] = useState(false)
    const [userProfile, setUserProfile] = useState<{ full_name: string | null; email: string | null; role: string | null } | null>(null)

    const profileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    useEffect(() => {
        let mounted = true
        const loadInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user
            if (!user || !mounted) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email, role')
                .eq('id', user.id)
                .single()

            if (!mounted) return

            if (profile) {
                setUserProfile(profile)
            } else {
                setUserProfile({ full_name: null, email: user.email ?? null, role: null })
            }
        }
        loadInitialData()
        return () => { mounted = false }
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        if (typeof window !== 'undefined') {
            localStorage.removeItem('moonstar_mortgage_authenticated')
            localStorage.removeItem('moonstar_mortgage_user_email')
            sessionStorage.clear()
        }
        toast('Logged out of Moonstar Mortgage Portal', 'info')
        router.replace('/mortgage/login')
    }

    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Mortgage Officer'
    const initial = displayName.charAt(0).toUpperCase()

    return (
        <header className="fixed top-0 left-0 right-0 h-16 lg:h-24 bg-gradient-to-r from-[#10B889] to-[#2E5C85] flex items-center z-40 shadow-md">
            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center px-3 sm:px-4 flex-shrink-0">
                <button 
                    onClick={onMenuClick}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    <Menu size={26} />
                </button>
            </div>

            <div
                className="flex-1 lg:flex-none lg:w-[260px] h-full flex items-center justify-center px-2 flex-shrink-0 cursor-pointer"
                onClick={() => router.push('/mortgage')}
            >
                <img
                    src="/Moonstarlogo-removebg-preview.png"
                    alt="Moonstar Mortgage Logo"
                    className="h-10 lg:h-16 w-auto object-contain max-w-[140px] sm:max-w-[200px] lg:max-w-none transition-transform duration-300 hover:scale-105"
                />
            </div>

            {/* Right Side Content */}
            <div className="flex-1 flex items-center justify-end px-3 sm:px-6">
                <div className="flex items-center gap-1.5 sm:gap-3 text-white flex-shrink-0">

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <div
                            className={`flex items-center gap-2 cursor-pointer p-1 rounded-lg transition-all ${profileOpen ? 'bg-white/20 ring-2 ring-white/50' : 'hover:bg-white/10'}`}
                            onClick={() => {
                                setProfileOpen(!profileOpen)
                            }}
                        >
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-[#10B889] flex items-center justify-center font-bold text-base sm:text-lg border-2 border-white/30 shadow-inner">
                                {initial}
                            </div>
                        </div>

                        {profileOpen && (
                            <div className="absolute right-0 top-12 lg:top-14 w-[min(260px,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl py-2 text-gray-800 z-50 border border-gray-100 flex flex-col ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5">Mortgage Portal</span>
                                    <p className="font-bold text-gray-900 text-base truncate leading-tight" title={displayName}>
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{userProfile?.email || 'mortgageadmin@moonstar.com'}</p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold rounded-xl transition-all text-left shadow-sm flex items-center justify-between group"
                                    >
                                        Logout
                                        <ChevronRight size={16} className="text-red-300 group-hover:text-white transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
