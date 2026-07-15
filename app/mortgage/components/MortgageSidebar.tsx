'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Layers, FileCheck, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function MortgageSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('moonstar_mortgage_authenticated');
      localStorage.removeItem('moonstar_mortgage_user_email');
      sessionStorage.clear();
    }
    router.replace('/mortgage/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/mortgage',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'New Loan Pipeline',
      href: '/mortgage/pipeline/new-loan',
      icon: Layers,
      exact: false,
    },
    {
      name: 'Pre Approval Pipeline',
      href: '/mortgage/pipeline/pre-approval',
      icon: FileCheck,
      exact: false,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0 min-h-dvh">
      {/* Brand Logo & Module Badge */}
      <div className="p-6 border-b border-slate-800 flex flex-col gap-2">
        <Link href="/mortgage" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
            M
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-white">
              Moonstar
            </h1>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Mortgage CRM
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Lending Workflows
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Mortgage CRM</span>
        </button>
      </div>
    </aside>
  );
}
