'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Clock, User, ChevronRight, Menu, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/lib/toast'

export default function LendingTopBar({ onMenuClick }: { onMenuClick: () => void }) {
    const router = useRouter()
    const [profileOpen, setProfileOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [userProfile, setUserProfile] = useState<{ full_name: string | null; email: string | null; role: string | null } | null>(null)

    const profileRef = useRef<HTMLDivElement>(null)
    const notificationsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false)
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false)
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
        toast('Logged out of Accurate Lending Portal', 'info')
        router.replace('/lending/login')
    }

    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Lending Officer'
    const initial = displayName.charAt(0).toUpperCase()

    const demoNotifications = [
        {
            id: '1',
            title: 'Term Sheet Received',
            message: 'American Commercial Bank & Trust submitted term sheet for Apex Logistics ($1.2M SBA 7a).',
            time: '10 mins ago',
            unread: true,
        },
        {
            id: '2',
            title: 'Good Faith Deposit Confirmed',
            message: 'Received $5,000 good faith deposit from Metro Grocery Store LLC.',
            time: '1 hour ago',
            unread: false,
        },
    ]

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
                onClick={() => router.push('/lending/dashboard')}
            >
                <img
                    src="/Accurate_Lending_Logo-removebg-preview.png"
                    alt="Accurate Lending Logo"
                    className="h-10 lg:h-14 w-auto object-contain max-w-[140px] sm:max-w-[200px] lg:max-w-none transition-transform duration-300 hover:scale-105"
                />
            </div>

            {/* Right Side Content */}
            <div className="flex-1 flex items-center justify-between px-3 sm:px-6">
                <div className="hidden md:flex items-center gap-2 text-blue-100 text-xs sm:text-sm font-semibold bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-sm">
                    <ShieldCheck size={16} className="text-teal-400" />
                    <span>Commercial Lending Portal • Authorized Access</span>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 text-white flex-shrink-0 ml-auto">

                    {/* Notification Bell */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={() => {
                                setNotificationsOpen(!notificationsOpen)
                                setProfileOpen(false)
                            }}
                            className={`p-2 rounded-full transition-all relative ${notificationsOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            aria-label="Notifications"
                        >
                            <Bell size={22} />
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#10B889] rounded-full"></span>
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 top-12 lg:top-14 w-[min(340px,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl py-0 text-gray-800 z-50 border border-gray-100 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 sm:px-5 sm:py-4 bg-slate-900 text-white border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-sm sm:text-base">Lending Activity Alerts</h3>
                                    <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Demo Feed</span>
                                </div>
                                <div className="max-h-[min(400px,55vh)] overflow-y-auto divide-y divide-gray-100">
                                    {demoNotifications.map((n) => (
                                        <div 
                                            key={n.id} 
                                            className={`px-4 py-3 sm:px-5 sm:py-4 hover:bg-blue-50/50 transition-colors cursor-pointer group ${n.unread ? 'bg-blue-50/25' : ''}`}
                                            onClick={() => {
                                                setNotificationsOpen(false)
                                                router.push('/lending/pipeline')
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <Bell size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate leading-tight">
                                                            {n.title}
                                                        </p>
                                                        {n.unread && <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0"></span>}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1 font-medium break-words leading-relaxed">
                                                        {n.message}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400 font-medium">
                                                        <Clock size={11} />
                                                        {n.time}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 bg-gray-50 text-center border-t border-gray-100">
                                    <button 
                                        onClick={() => {
                                            setNotificationsOpen(false)
                                            router.push('/lending/activity-log')
                                        }}
                                        className="text-xs font-bold text-blue-700 hover:text-blue-900 uppercase tracking-widest py-1 block w-full"
                                    >
                                        View Full Activity Log →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <div
                            className={`flex items-center gap-2 cursor-pointer p-1 rounded-lg transition-all ${profileOpen ? 'bg-white/20 ring-2 ring-white/50' : 'hover:bg-white/10'}`}
                            onClick={() => {
                                setProfileOpen(!profileOpen)
                                setNotificationsOpen(false)
                            }}
                        >
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-[#10B889] flex items-center justify-center font-bold text-base sm:text-lg border-2 border-white/30 shadow-inner">
                                {initial}
                            </div>
                        </div>

                        {profileOpen && (
                            <div className="absolute right-0 top-12 lg:top-14 w-[min(260px,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl py-2 text-gray-800 z-50 border border-gray-100 flex flex-col ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5">Lending Portal</span>
                                    <p className="font-bold text-gray-900 text-base truncate leading-tight" title={displayName}>
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{userProfile?.email || 'Authorized Account'}</p>
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
