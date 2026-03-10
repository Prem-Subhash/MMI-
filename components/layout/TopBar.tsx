'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Clock, User, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function TopBar() {
    const router = useRouter()
    const [profileOpen, setProfileOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [userProfile, setUserProfile] = useState<{ full_name: string | null; email: string | null } | null>(null)
    const [notifications, setNotifications] = useState<any[]>([])

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
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Fetch Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', user.id)
                    .single()
                
                if (profile) {
                    setUserProfile(profile)
                } else {
                    setUserProfile({ full_name: null, email: user.email ?? null })
                }

                // Fetch Recent Activity (Notifications)
                const { data: leads } = await supabase
                    .from('temp_leads_basics')
                    .select(`
                        id,
                        client_name,
                        created_at,
                        current_stage:pipeline_stages (
                            stage_name
                        )
                    `)
                    .eq('assigned_csr', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (leads) {
                    const mapped = leads.map(l => ({
                        id: l.id,
                        name: l.client_name,
                        status: Array.isArray(l.current_stage) 
                            ? (l.current_stage[0] as any)?.stage_name 
                            : (l.current_stage as any)?.stage_name || 'New Lead',
                        time: new Date(l.created_at).toLocaleString()
                    }))
                    setNotifications(mapped)
                }
            }
        }
        loadInitialData()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.replace('/login')
    }

    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User'
    const initial = displayName.charAt(0).toUpperCase()

    return (
        <header className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-r from-[#10B889] to-[#2E5C85] flex z-40 shadow-md">
            {/* Logo Container - Transparent */}
            <div className="w-[260px] h-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                onClick={() => window.location.href = '/'}
            >
                <img
                    src="/logo.png"
                    alt="Moonstar Logo"
                    className="h-16 w-auto object-contain"
                />
            </div>

            {/* Right Side Content */}
            <div className="flex-1 flex items-center justify-end px-6">
                <div className="flex items-center gap-6 text-white flex-shrink-0">
                    {/* Notification Bell */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={() => {
                                setNotificationsOpen(!notificationsOpen)
                                setProfileOpen(false)
                            }}
                            className={`p-2 rounded-full transition-all relative ${notificationsOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                        >
                            <Bell size={28} />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 border-2 border-[#10B889] rounded-full"></span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl py-0 text-gray-800 z-50 border border-gray-100 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">Recent Activity</h3>
                                    <span className="text-[10px] font-bold bg-[#10B889]/10 text-[#10B889] px-2 py-0.5 rounded-full uppercase tracking-wider">Updates</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <div 
                                                key={n.id} 
                                                className="px-5 py-4 border-b border-gray-50 hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                                                onClick={() => {
                                                    setNotificationsOpen(false)
                                                    router.push('/csr/activity-log')
                                                }}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[#10B889]/10 flex items-center justify-center text-[#10B889] flex-shrink-0 group-hover:bg-[#10B889] group-hover:text-white transition-colors">
                                                        <User size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate leading-tight">
                                                                {n.name}
                                                            </p>
                                                            <ChevronRight size={14} className="text-gray-300 transition-transform group-hover:translate-x-1" />
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-1 font-medium">
                                                            <span className="text-[#2E5C85]">Stage:</span> {n.status}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 font-medium">
                                                            <Clock size={12} />
                                                            {n.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center flex flex-col items-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <Bell size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium italic">No recent updates found.</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setNotificationsOpen(false)
                                        router.push('/csr/activity-log')
                                    }}
                                    className="w-full py-3 text-sm font-bold text-[#2E5C85] hover:bg-gray-50 transition-colors border-t border-gray-100 uppercase tracking-widest"
                                >
                                    View Activity Log
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <div
                            className={`flex items-center gap-3 cursor-pointer p-1 rounded-lg transition-all ${profileOpen ? 'bg-white/20 ring-2 ring-white/50' : 'hover:bg-white/10'}`}
                            onClick={() => {
                                setProfileOpen(!profileOpen)
                                setNotificationsOpen(false)
                            }}
                        >
                            <div className="w-11 h-11 rounded-full bg-white text-[#10B889] flex items-center justify-center font-bold text-lg border-2 border-white/30 shadow-inner">
                                {initial}
                            </div>
                        </div>

                        {profileOpen && (
                            <div className="absolute right-0 top-14 w-60 bg-white rounded-2xl shadow-2xl py-2 text-gray-800 z-50 border border-gray-100 flex flex-col ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Logged In As</p>
                                    <p className="font-bold text-gray-900 text-lg truncate leading-tight" title={displayName}>
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{userProfile?.email}</p>
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
