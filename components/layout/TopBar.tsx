'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

export default function TopBar() {
    const router = useRouter()
    const [profileOpen, setProfileOpen] = useState(false)

    return (
        <header className="h-24 bg-gradient-to-r from-[#10B889] to-[#2E5C85] flex items-center justify-end px-6 shadow-md relative z-40">
            <div className="flex items-center gap-6 text-white flex-shrink-0">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Bell size={28} />
                </button>
                <div className="relative">
                    <div
                        className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={() => setProfileOpen(!profileOpen)}
                    >
                        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border-2 border-white/30">
                            P
                        </div>
                    </div>

                    {profileOpen && (
                        <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-xl py-2 text-gray-800 z-50 border border-gray-100 flex flex-col ring-1 ring-black/5">
                            <div className="px-5 py-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-600">Signed in as</p>
                                <p className="font-bold text-gray-900 text-lg">CSR-1</p>
                            </div>
                            <button
                                onClick={() => router.push('/login')}
                                className="m-2 px-4 py-2 bg-[#0FAFB6] hover:bg-[#0C8C92] text-white font-medium rounded-lg transition-colors text-left shadow-sm"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}