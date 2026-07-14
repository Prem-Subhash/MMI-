'use client';

import React from 'react';
import { User } from 'lucide-react';

export default function MortgageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-white leading-none">Moonstar Officer</div>
            <div className="text-[10px] text-slate-400 mt-1">Lending Desk</div>
          </div>
        </div>
      </div>
    </header>
  );
}
