'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

export default function MortgageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">
          <Building2 size={14} />
          <span>Moonstar Mortgage Workflow Pipeline</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-white/80 mt-0.5 max-w-2xl">{subtitle}</p>}
      </div>
    </div>
  );
}
