'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Clock, User, ChevronRight, Menu } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
    const router = useRouter()
    const [profileOpen, setProfileOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [activityOpen, setActivityOpen] = useState(false)
    const [userProfile, setUserProfile] = useState<{ full_name: string | null; email: string | null; role: string | null } | null>(null)
    const [notifications, setNotifications] = useState<any[]>([])
    const [activities, setActivities] = useState<any[]>([])

    const profileRef = useRef<HTMLDivElement>(null)
    const notificationsRef = useRef<HTMLDivElement>(null)
    const activityRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false)
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false)
            }
            if (activityRef.current && !activityRef.current.contains(event.target as Node)) {
                setActivityOpen(false)
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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email, role')
                    .eq('id', user.id)
                    .single()
                
                if (profile) {
                    setUserProfile(profile)
                } else {
                    setUserProfile({ full_name: null, email: user.email ?? null, role: null })
                }

                // FETCH NOTIFICATIONS (BELL)
                // Wrapped safely so it doesn't crash the entire TopBar if the schema isn't applied yet
                const { data: notifs, error: notifError } = await supabase
                    .from('user_notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5)
                
                if (!notifError && notifs) {
                    setNotifications(notifs.map(n => ({
                        id: n.id,
                        name: 'System Alert',
                        status: n.message,
                        time: new Date(n.created_at).toLocaleString(),
                        is_read: n.is_read
                    })))
                } else {
                    setNotifications([]) 
                }

                // FETCH ACTIVITIES (CLOCK)
                let query = supabase
                    .from('temp_leads_basics')
                    .select(`
                        id,
                        client_name,
                        created_at,
                        current_stage:pipeline_stages (
                            stage_name
                        )
                    `)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (profile && profile.role === 'csr') {
                    query = query.eq('assigned_csr', user.id)
                }

                const { data: leads } = await query

                if (leads) {
                    const mapped = leads.map(l => ({
                        id: l.id,
                        name: l.client_name,
                        status: Array.isArray(l.current_stage) 
                            ? (l.current_stage[0] as any)?.stage_name 
                            : (l.current_stage as any)?.stage_name || 'New Lead',
                        time: new Date(l.created_at).toLocaleString()
                    }))
                    setActivities(mapped)
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

            {/* Logo Container */}
            <div
                className="flex-1 lg:flex-none lg:w-[260px] h-full flex items-center justify-center px-2 flex-shrink-0 cursor-pointer"
                onClick={() => window.location.href = '/'}
            >
                <img
                    src="/logo.png"
                    alt="Moonstar Logo"
                    className="h-10 lg:h-16 w-auto object-contain max-w-[140px] sm:max-w-[200px] lg:max-w-none"
                />
            </div>

            {/* Right Side Content */}
            <div className="flex-1 flex items-center justify-end px-3 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-4 text-white flex-shrink-0">

                    {/* Notification Bell */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={() => {
                                setNotificationsOpen(!notificationsOpen)
                                setActivityOpen(false)
                                setProfileOpen(false)
                            }}
                            className={`p-2 rounded-full transition-all relative ${notificationsOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            aria-label="Notifications"
                        >
                            <Bell size={22} />
                            {notifications.some((n) => !n.is_read) && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#10B889] rounded-full"></span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-0 top-12 lg:top-14 w-[min(320px,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl py-0 text-gray-800 z-50 border border-gray-100 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">Notifications</h3>
                                    <span className="text-[10px] font-bold bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Alerts</span>
                                </div>
                                <div className="max-h-[min(400px,55vh)] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <div 
                                                key={n.id} 
                                                className={`px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-50 hover:bg-emerald-50/30 transition-colors cursor-pointer group ${!n.is_read ? 'bg-blue-50/20' : ''}`}
                                                onClick={() => {
                                                    setNotificationsOpen(false)
                                                    router.push(n.lead_id ? `/csr/leads/${n.lead_id}` : '/csr/activity-log')
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                        <Bell size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm group-hover:text-emerald-700 transition-colors truncate leading-tight ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                                {n.name}
                                                            </p>
                                                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></span>}
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1 font-medium break-words whitespace-pre-wrap">
                                                            {n.status}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400 font-medium">
                                                            <Clock size={11} />
                                                            {n.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center flex flex-col items-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <Bell size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium italic text-sm">You have no unread notifications.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity Clock */}
                    <div className="relative" ref={activityRef}>
                        <button
                            onClick={() => {
                                setActivityOpen(!activityOpen)
                                setNotificationsOpen(false)
                                setProfileOpen(false)
                            }}
                            className={`p-2 rounded-full transition-all relative ${activityOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            aria-label="Recent Activity"
                        >
                            <Clock size={22} />
                        </button>

                        {activityOpen && (
                            <div className="absolute right-0 top-12 lg:top-14 w-[min(320px,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl py-0 text-gray-800 z-50 border border-gray-100 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">Recent Activity</h3>
                                    <span className="text-[10px] font-bold bg-[#10B889]/10 text-[#10B889] px-2 py-0.5 rounded-full uppercase tracking-wider">Updates</span>
                                </div>
                                <div className="max-h-[min(400px,55vh)] overflow-y-auto">
                                    {activities.length > 0 ? (
                                        activities.map((n) => (
                                            <div 
                                                key={n.id} 
                                                className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-50 hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                                                onClick={() => {
                                                    setActivityOpen(false)
                                                    router.push('/csr/activity-log')
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-[#10B889]/10 flex items-center justify-center text-[#10B889] flex-shrink-0 group-hover:bg-[#10B889] group-hover:text-white transition-colors">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate leading-tight text-sm">
                                                                {n.name}
                                                            </p>
                                                            <ChevronRight size={14} className="text-gray-300 transition-transform group-hover:translate-x-1 flex-shrink-0 mt-0.5" />
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-1 font-medium">
                                                            <span className="text-[#2E5C85]">Stage:</span> {n.status}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-400 font-medium">
                                                            <Clock size={11} />
                                                            {n.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center flex flex-col items-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <Clock size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium italic text-sm">No recent leads found.</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setActivityOpen(false)
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
                            <div className="absolute right-0 top-12 lg:top-14 w-[min(240px,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl py-2 text-gray-800 z-50 border border-gray-100 flex flex-col ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Logged In As</p>
                                    <p className="font-bold text-gray-900 text-base truncate leading-tight" title={displayName}>
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
