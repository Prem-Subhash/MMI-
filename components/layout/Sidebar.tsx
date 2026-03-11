'use client'

import { LayoutGrid, Users, Settings, GitBranch, RefreshCw, Briefcase, FileText, PieChart, ListTodo, DollarSign, Activity } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface SidebarProps {
    setIsHovered: (hovered: boolean) => void
    isHovered: boolean
}

interface MenuItem {
    label: string
    href: string
    icon: React.ReactNode
}

export default function Sidebar({ setIsHovered, isHovered }: SidebarProps) {
    const pathname = usePathname()
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (data?.role) {
                    setRole(data.role)
                }
            }
        }
        fetchRole()
    }, [])

    // Helper to check if a link is active.
    const isActive = (path: string) => {
        if (pathname === path) return true
        if (path !== '/' && path !== `/${role}` && pathname.startsWith(path)) return true
        return false
    }

    const csrMenu: MenuItem[] = [
        { label: 'Dashboard', href: '/csr', icon: <LayoutGrid size={28} /> },
        { label: 'Personal Pipeline', href: '/csr/leads', icon: <GitBranch size={28} /> },
        { label: 'Personal Renewal', href: '/csr/renewals/personal', icon: <RefreshCw size={28} /> },
        { label: 'Commercial Pipeline', href: '/csr/pipeline/commercial', icon: <Briefcase size={28} /> },
        { label: 'Commercial Renewal', href: '/csr/renewals/commercial', icon: <RefreshCw size={28} /> },
        { label: 'Reports', href: '/csr/reports', icon: <FileText size={28} /> },
    ]

    const adminMenu: MenuItem[] = [
        { label: 'Dashboard', href: '/admin', icon: <LayoutGrid size={28} /> },
        { label: 'All Leads', href: '/admin/leads', icon: <GitBranch size={28} /> },
        { label: 'Lead Assignments', href: '/admin/assignments', icon: <ListTodo size={28} /> },
        { label: 'Pipelines Monitor', href: '/admin/pipelines', icon: <Activity size={28} /> },
        { label: 'CSR Performance', href: '/admin/csrs', icon: <Users size={28} /> },
        { label: 'Reports', href: '/admin/reports', icon: <PieChart size={28} /> },
    ]

    const accountingMenu: MenuItem[] = [
        { label: 'Dashboard', href: '/accounting', icon: <LayoutGrid size={28} /> },
        { label: 'Financial Reports', href: '/accounting/reports', icon: <DollarSign size={28} /> },
    ]

    const superadminMenu: MenuItem[] = [
        { label: 'Dashboard', href: '/superadmin', icon: <LayoutGrid size={28} /> },
        { label: 'Users', href: '/superadmin/users', icon: <Users size={28} /> },
        { label: 'Roles', href: '/superadmin/roles', icon: <Users size={28} /> },
        { label: 'Pipelines', href: '/superadmin/pipelines', icon: <Activity size={28} /> },
        { label: 'Email Templates', href: '/superadmin/email-templates', icon: <FileText size={28} /> },
        { label: 'Forms', href: '/superadmin/forms', icon: <ListTodo size={28} /> },
        { label: 'Settings', href: '/superadmin/system-settings', icon: <Settings size={28} /> },
        { label: 'Audit Logs', href: '/superadmin/audit-logs', icon: <Activity size={28} /> },
        { label: 'Admin View', href: '/admin', icon: <PieChart size={28} /> },
        { label: 'Accounting View', href: '/accounting', icon: <DollarSign size={28} /> },
    ]

    const getMenuForRole = () => {
        switch (role) {
            case 'csr': return csrMenu
            case 'admin': return adminMenu
            case 'accounting': return accountingMenu
            case 'superadmin': return superadminMenu
            default: return [] // Return empty or loading state while role fetches
        }
    }

    const currentMenu = getMenuForRole()

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
            <nav className="flex-1 flex flex-col gap-4 mt-4 w-full px-3 overflow-y-auto pb-8">
                {currentMenu.map((item, index) => (
                    <Link key={index} href={item.href} className="w-full">
                        <SidebarIcon
                            icon={item.icon}
                            label={item.label}
                            active={isActive(item.href)}
                            expanded={isHovered}
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