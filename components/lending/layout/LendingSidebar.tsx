'use client'

import { LayoutGrid, GitBranch, Briefcase, Activity, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
    setIsHovered: (hovered: boolean) => void
    isHovered: boolean
    isMobileOpen: boolean
    setIsMobileOpen: (open: boolean) => void
}

interface MenuItem {
    label: string
    href: string
    icon: React.ReactNode
    badge?: string
}

export default function LendingSidebar({ setIsHovered, isHovered, isMobileOpen, setIsMobileOpen }: SidebarProps) {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (pathname === path) return true
        if (path !== '/lending/dashboard' && pathname.startsWith(path)) return true
        return false
    }

    const lendingMenu: MenuItem[] = [
        { label: 'Dashboard', href: '/lending/dashboard', icon: <LayoutGrid size={24} /> },
        { label: 'Lending Pipeline', href: '/lending/pipeline', icon: <GitBranch size={24} />, badge: '21 Stages' },
        { label: 'Loans Directory', href: '/lending/loans', icon: <Briefcase size={24} /> },
        { label: 'Activity Log', href: '/lending/activity-log', icon: <Activity size={24} /> },
    ]

    return (
        <aside
            className={`
                fixed left-0 bottom-0 z-[50] bg-gradient-to-b from-[#10B889] to-[#2E5C85] text-white flex flex-col shadow-xl 
                transition-all duration-300 ease-in-out
                top-16 lg:top-24
                ${isMobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'}
                ${isHovered ? 'lg:w-[260px] items-start' : 'lg:w-[110px] items-center'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Quick Add Loan Action Button inside Sidebar */}
            <div className={`w-full pt-4 px-3 mb-2 transition-all duration-300 ${isHovered || isMobileOpen ? 'opacity-100' : 'lg:px-2'}`}>
                <Link
                    href="/lending/loans/new"
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                        flex items-center justify-center gap-2.5 bg-brand hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group
                        ${isHovered || isMobileOpen ? 'w-full' : 'w-[56px] h-[56px] mx-auto p-0'}
                    `}
                    title="New Loan Application"
                >
                    <PlusCircle size={22} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className={`whitespace-nowrap transition-all duration-300 tracking-tight ${isHovered || isMobileOpen ? 'text-sm opacity-100 block' : 'text-[0px] opacity-0 hidden'}`}>
                        New Loan
                    </span>
                </Link>
            </div>

            <div className="w-full px-4 py-1">
                <div className="border-t border-white/10 w-full"></div>
            </div>

            <nav className="flex-1 flex flex-col gap-2 mt-2 w-full px-2 overflow-y-auto pb-8">
                {lendingMenu.map((item, index) => (
                    <Link 
                        key={index} 
                        href={item.href} 
                        className="w-full"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <SidebarIcon
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            active={isActive(item.href)}
                            expanded={isHovered || isMobileOpen}
                        />
                    </Link>
                ))}
            </nav>
        </aside>
    )
}

function SidebarIcon({
    icon,
    label,
    badge,
    active,
    expanded,
}: {
    icon: React.ReactNode
    label: string
    badge?: string
    active?: boolean
    expanded: boolean
}) {
    return (
        <div
            title={label}
            className={`
                flex transition-all duration-300 ease-in-out rounded-xl cursor-pointer relative group
                ${expanded
                    ? 'flex-row items-center justify-between h-[56px] px-4 gap-3 w-full'
                    : 'flex-col items-center justify-center h-[72px] w-[72px] gap-1.5 mx-auto'
                }
                ${active
                    ? 'bg-white text-[#10B889] shadow-lg'
                    : 'text-white/80 hover:bg-white/10 hover:text-white hover:shadow-md'
                }
            `}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 transition-transform group-hover:scale-110">{icon}</div>
                <span
                    className={`
                        font-semibold tracking-wide transition-all duration-300 whitespace-nowrap truncate
                        ${expanded ? 'text-sm opacity-100' : 'text-[0px] opacity-0 overflow-hidden'}
                    `}
                >
                    {label}
                </span>
            </div>

            {badge && expanded && (
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shadow-sm flex-shrink-0 border border-white/30">
                    {badge}
                </span>
            )}
        </div>
    )
}
