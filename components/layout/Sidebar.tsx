'use client'

import { LayoutGrid, Settings, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface SidebarProps {
    setIsHovered: (hovered: boolean) => void
    isHovered: boolean
}

export default function Sidebar({ setIsHovered, isHovered }: SidebarProps) {
    const pathname = usePathname()

    // Helper to check if a link is active.
    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true
        if (path !== '/dashboard' && pathname.startsWith(path)) return true
        return false
    }

    return (
        <aside
            className={`
                fixed left-0 top-24 bottom-0 z-30 bg-gradient-to-b from-[#10B889] to-[#2E5C85] text-white flex flex-col shadow-xl 
                transition-all duration-300 ease-in-out
                ${isHovered ? 'w-[260px] items-start' : 'w-[110px] items-center'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <nav className="flex-1 flex flex-col gap-4 mt-8 w-full px-3">
                <Link href="/dashboard" className="w-full">
                    <SidebarIcon
                        icon={<LayoutGrid size={28} />}
                        label="Dashboard"
                        active={isActive('/dashboard')}
                        expanded={isHovered}
                    />
                </Link>

                <Link href="/dashboard/leads" className="w-full">
                    <SidebarIcon
                        icon={<GitBranch size={28} />}
                        label="Personal Pipeline"
                        active={isActive('/dashboard/leads')}
                        expanded={isHovered}
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
    expanded,
}: {
    icon: React.ReactNode
    label: string
    active?: boolean
    expanded: boolean
}) {
    return (
        <div
            title={label}
            className={`
                flex transition-all duration-300 ease-in-out rounded-xl cursor-pointer
                ${expanded
                    ? 'flex-row items-center justify-start h-[64px] px-6 gap-4 w-full'
                    : 'flex-col items-center justify-center h-[84px] w-[84px] gap-2 mx-auto'
                }
                ${active
                    ? 'bg-white text-[#10B889] shadow-lg'
                    : 'text-white/80 hover:bg-white/10 hover:text-white hover:shadow-md'
                }
            `}
        >
            <div className="flex-shrink-0">{icon}</div>
            <span
                className={`
                    font-semibold tracking-wide transition-all duration-300 whitespace-nowrap
                    ${expanded ? 'text-base opacity-100' : 'text-[0px] opacity-0 overflow-hidden'}
                `}
            >
                {label}
            </span>
        </div>
    )
}