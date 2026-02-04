'use client'

import { LayoutGrid, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
    const pathname = usePathname()

    // Helper to check if a link is active.
    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true
        if (path !== '/dashboard' && pathname.startsWith(path)) return true
        return false
    }

    return (
        <aside className="fixed left-0 top-0 bottom-0 z-50 bg-gradient-to-b from-[#10B889] to-[#2E5C85] text-white flex flex-col shadow-xl w-[260px]">
            <div className="h-24 flex-shrink-0 flex items-center justify-center border-b border-white/10 px-4">
                <img
                    src="/Moonstarlogo.jpeg"
                    alt="Moonstar Logo"
                    className="h-16 w-auto rounded-lg object-contain bg-white shadow-sm"
                />
            </div>

            <nav className="flex-1 flex flex-col gap-4 mt-8 w-full px-4 overflow-y-auto">
                <Link href="/dashboard" className="w-full">
                    <SidebarIcon
                        icon={<LayoutGrid size={24} />}
                        label="Dashboard"
                        active={isActive('/dashboard')}
                    />
                </Link>

                <Link href="/dashboard/leads" className="w-full">
                    <SidebarIcon
                        icon={<LayoutGrid size={24} />}
                        label="Personal Pipeline"
                        active={isActive('/dashboard/leads')}
                    />
                </Link>

                <Link href="/dashboard/settings" className="w-full">
                    <SidebarIcon
                        icon={<Settings size={24} />}
                        label="Settings"
                        active={isActive('/dashboard/settings')}
                    />
                </Link>
            </nav>
        </aside>
    )
}

function SidebarIcon({
    icon,
    label,
    active,
}: {
    icon: React.ReactNode
    label: string
    active?: boolean
}) {
    return (
        <div
            title={label}
            className={`
                flex items-center justify-start h-[56px] px-6 gap-4 w-full rounded-xl cursor-pointer transition-colors duration-200
                ${active
                    ? 'bg-white text-[#10B889]'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }
            `}
        >
            <div className="flex-shrink-0">{icon}</div>
            <span className="font-semibold tracking-wide text-sm whitespace-nowrap">
                {label}
            </span>
        </div>
    )
}